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
import { SizeExceedError } from '../Infra/ethereum/ethereum.types';
import https from 'https';
import TokensHandler from '../TokenHandlers/tokens-handler/tokens.handler';

@Injectable()
export class SqsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SqsConsumerService.name);
  public sqsConsumer: Consumer;
  public queue: AWS.SQS;

  constructor(
    private readonly configService: ConfigService,
    private readonly nftCollectionTaskService: DalNFTCollectionTaskService,
    private tokensHandler: TokensHandler,
  ) {
    const region = this.configService.get('aws.region');
    const accessKeyId = this.configService.get('aws.accessKeyId');
    const secretAccessKey = this.configService.get('aws.secretAccessKey');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'Initialize AWS queue failed, please check required variables',
      );
    }

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

    await this.nftCollectionTaskService.updateNFTCollectionTask({
      ...nftCollectionTask,
      status: MessageStatus.processing,
    });

    this.logger.log(
      `Getting transfer history for block ${nftCollectionTask.startBlock} - ${nftCollectionTask.endBlock}`,
    );

    const { contractAddress, startBlock, endBlock, tokenType } =
      receivedMessage;

    this.tokensHandler.start(contractAddress, startBlock, endBlock, tokenType);
  }

  onError(error: Error, message: AWS.SQS.Message) {
    this.logger.log(`SQS error ${error.message}`);
    this.handleError(error, message);
  }

  onProcessingError(error: Error, message: AWS.SQS.Message) {
    this.logger.log(`Processing error ${error.message}`);
    this.handleError(error, message);
  }

  onTimeoutError(error: Error, message: AWS.SQS.Message) {
    this.logger.log(`Timeout error ${error.message}`);
    this.handleError(error, message);
  }

  onMessageProcessed(message: AWS.SQS.Message) {
    this.nftCollectionTaskService.removeNFTCollectionTask(message.MessageId);
    this.logger.log(`Messages ${message?.MessageId} have been processed `);
  }

  private handleError(error: Error, message: AWS.SQS.Message) {
    const receivedMessage = JSON.parse(message.Body) as ReceivedMessage;

    const nftCollectionTask = {
      messageId: message.MessageId,
      contractAddress: receivedMessage.contractAddress,
      startBlock: receivedMessage.startBlock,
      endBlock: receivedMessage.endBlock,
    };

    if (error instanceof SizeExceedError) {
      //split status
      this.nftCollectionTaskService.updateNFTCollectionTask({
        ...nftCollectionTask,
        status: MessageStatus.split,
      });
    } else {
      //error status
      this.nftCollectionTaskService.updateNFTCollectionTask({
        ...nftCollectionTask,
        status: MessageStatus.error,
      });
    }
    this.deleteMessage(message);
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
