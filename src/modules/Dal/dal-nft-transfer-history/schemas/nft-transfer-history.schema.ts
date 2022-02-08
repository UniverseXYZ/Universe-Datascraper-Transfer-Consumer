import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'nft-transfer-histories' })
export class NFTTransferHistory {
  @Prop({ trim: true, index: true, required: true })
  public contractAddress: string;

  @Prop()
  public blockNum: number;

  @Prop({ index: true, required: true })
  public hash: string;

  @Prop({ required: true })
  public from: string;

  @Prop({ required: true })
  public to: string;

  @Prop()
  public value: string;

  @Prop()
  public erc721Tokenid: string;

  @Prop({ type: 'object' })
  public erc1155Metadata: any;

  @Prop({ index: true, required: true, enum: ['ERC721', 'ERC1155'] })
  public category: string;

  @Prop()
  public timeLastUpdated: string;
}

export type NFTTransferHistoryDocument = NFTTransferHistory & Document;

export const NFTTransferHistorySchema: SchemaFactory =
  SchemaFactory.createForClass(NFTTransferHistory);
