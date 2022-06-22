import {
  Logger,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { Consumer } from 'sqs-consumer';
import AWS from 'aws-sdk';
import {
  ERROR_EVENT_NAME,
  PROCESSING_ERROR_EVENT_NAME,
  ReceivedMessage,
  TIMEOUT_EVENT_NAME,
  MESSAGE_PROCESSED_EVENT_NAME,
} from './sqs-consumer.types';
import { ConfigService } from '@nestjs/config';
import { DalNFTCollectionTaskService } from '../Dal/dal-nft-collection-task/dal-nft-collection-task.service';
import { MessageStatus } from '../Dal/dal-nft-collection-task/schemas/nft-collection-task.schema';
import https from 'https';
import TokensHandler from '../TokenHandlers/tokens-handler/tokens.handler';
import {
  BulkWriteError,
  SizeExceedError,
} from '../TokenHandlers/tokens-handler/interfaces/tokens.interface';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsConsumerService.name);
  public sqsConsumer: Consumer;
  public queue: AWS.SQS;
  public batchSize: number;
  public blocksInterval: number;
  public source: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly nftCollectionTaskService: DalNFTCollectionTaskService,
    private tokensHandler: TokensHandler,
  ) {
    const region = this.configService.get('aws.region');
    const accessKeyId = this.configService.get('aws.accessKeyId');
    const secretAccessKey = this.configService.get('aws.secretAccessKey');
    const batchSize = this.configService.get('mongodb.batchSize');
    const blocksInterval = this.configService.get('queue.blocksInterval');
    const source = this.configService.get('source');

    if (
      !region ||
      !accessKeyId ||
      !secretAccessKey ||
      !batchSize ||
      !blocksInterval
    ) {
      throw new Error(
        'Initialize AWS queue failed, please check required variables',
      );
    }

    if (source !== 'ARCHIVE' && source !== 'MONITOR') {
      throw new Error(`SOURCE has invalid value(${source})`);
    }

    this.source = source;
    this.batchSize = Number(batchSize);
    this.blocksInterval = Number(blocksInterval);

    AWS.config.update({
      region,
      accessKeyId,
      secretAccessKey,
    });
  }

  public onModuleInit() {
    this.logger.log('onModuleInit');
    this.queue = new AWS.SQS({
      httpOptions: {
        agent: new https.Agent({
          keepAlive: true,
        }),
      },
    });
    this.sqsConsumer = Consumer.create({
      queueUrl: this.configService.get('aws.queueUrl'),
      sqs: this.queue,
      handleMessage: this.handleMessage.bind(this),
    });

    this.logger.log('Register events');
    //listen to events
    this.sqsConsumer.addListener(ERROR_EVENT_NAME, this.onError.bind(this));
    this.sqsConsumer.addListener(
      PROCESSING_ERROR_EVENT_NAME,
      this.onProcessingError.bind(this),
    );
    this.sqsConsumer.addListener(
      TIMEOUT_EVENT_NAME,
      this.onTimeoutError.bind(this),
    );
    this.sqsConsumer.addListener(
      MESSAGE_PROCESSED_EVENT_NAME,
      this.onMessageProcessed.bind(this),
    );

    this.logger.log('Consumer starts');
    this.sqsConsumer.start();
  }

  public onModuleDestroy() {
    this.logger.log('Consumer stops');
    this.sqsConsumer.stop();
  }

  async handleMessage(message: AWS.SQS.Message) {
    this.logger.log(`Consumer handle message id:(${message.MessageId})`);
    const receivedMessage = JSON.parse(message.Body) as ReceivedMessage;

    const nftCollectionTask = {
      messageId: message.MessageId,
      contractAddress: receivedMessage.contractAddress,
      startBlock: receivedMessage.startBlock,
      endBlock: receivedMessage.endBlock,
      tokenType: receivedMessage.tokenType,
    };

    this.logger.log(`Set message id:(${message.MessageId}) as processing`);

    const blockInterval =
      nftCollectionTask.endBlock - nftCollectionTask.startBlock;

    if (blockInterval > this.blocksInterval) {
      this.logger.log(
        `[${this.source.toLowerCase()} Transfer Flow] Block interval is bigger(${blockInterval}) than max allowed(${
          this.blocksInterval
        }). Splitting the task into batches...`,
      );

      await this.nftCollectionTaskService.updateNFTCollectionTask({
        ...nftCollectionTask,
        status: MessageStatus.split,
        source: this.source,
      });

      return;
    }

    await this.nftCollectionTaskService.updateNFTCollectionTask({
      ...nftCollectionTask,
      status: MessageStatus.processing,
    });

    const { contractAddress, startBlock, endBlock, tokenType } =
      nftCollectionTask;

    this.logger.log(
      `[${this.source} Transfer Flow] Getting transfer history for block ${startBlock} - ${endBlock}`,
    );

    await this.tokensHandler.start(
      contractAddress,
      startBlock,
      endBlock,
      tokenType,
      this.batchSize,
    );
  }

  async onError(error: Error, message: AWS.SQS.Message) {
    this.logger.log(`SQS error ${error.message}`);
    await this.handleError(error, message, 'SQS');
  }

  async onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.log(`Processing error ${error.message}`);
    await this.handleError(error, message, 'Processing');
  }

  async onTimeoutError(error: Error, message: AWS.SQS.Message) {
    this.logger.log(`Timeout error ${error.message}`);
    await this.handleError(error, message, 'Timeout');
  }

  async onMessageProcessed(message: AWS.SQS.Message) {
    await this.nftCollectionTaskService.removeNFTCollectionTask(
      message.MessageId,
    );
    this.logger.log(`Messages ${message?.MessageId} have been processed `);
  }

  private async handleError(
    error: Error,
    message: AWS.SQS.Message,
    type: string,
  ) {
    const receivedMessage = JSON.parse(message.Body) as ReceivedMessage;

    const nftCollectionTask = {
      messageId: message.MessageId,
      contractAddress: receivedMessage.contractAddress,
      startBlock: receivedMessage.startBlock,
      endBlock: receivedMessage.endBlock,
    };

    if (error instanceof SizeExceedError || error instanceof BulkWriteError) {
      //split status
      // case 1: if size exceed, split the task
      // case 2: if duplicated, split is better than return message back to queue as it has to be wait until visibility timeout
      await this.nftCollectionTaskService.updateNFTCollectionTask({
        ...nftCollectionTask,
        status: MessageStatus.split,
        source: this.source,
      });
    } else {
      //error status
      await this.updateTaskWithError(error, nftCollectionTask, type);
    }

    await this.deleteMessage(message);
  }

  private async updateTaskWithError(
    error: Error,
    nftCollectionTask: any,
    type: string,
  ) {
    await this.nftCollectionTaskService.updateNFTCollectionTask({
      ...nftCollectionTask,
      status: MessageStatus.error,
      errorMessage:
        `Error type: [${type}] - ${error.stack || error.message}` ||
        `Error type: [${type}] - ${JSON.stringify(error)}`,
    });
  }

  private async deleteMessage(message: AWS.SQS.Message) {
    const deleteParams = {
      QueueUrl: this.configService.get('aws.queueUrl'),
      ReceiptHandle: message.ReceiptHandle,
    };

    try {
      await this.queue.deleteMessage(deleteParams).promise();
    } catch (err) {
      console.log(err);
      this.logger.log(`Deleting Message(${message?.MessageId}) ERROR`);
    }
  }
}
