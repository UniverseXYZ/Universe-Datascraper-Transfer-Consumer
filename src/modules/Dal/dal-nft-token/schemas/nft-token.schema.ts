import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export class Owner {
  @Prop({ trim: true, index: true, required: true })
  address: string;

  @Prop({ trim: true, index: true, required: true })
  transactionHash: string;

  @Prop({ required: true })
  value: number;
}

@Schema({ timestamps: true, collection: 'nft-tokens' })
export class NFTToken {
  @Prop({ trim: true, index: true, required: true })
  public contractAddress: string;

  @Prop({ trim: true, index: true, required: true })
  public tokenId: string;

  @Prop({ index: true, required: true, enum: ['ERC721', 'ERC1155'] })
  public tokenType: string;

  @Prop()
  public externalDomainViewUrl: string;

  @Prop({ type: Object })
  public metaData: any;

  @Prop()
  public firstOwner: string;

  @Prop()
  public latestOwner: string;

  @Prop()
  public owners: Owner[];

  @Prop()
  public metadataFetchError: string;
}

export type NFTTokensDocument = NFTToken & Document;

export const NFTTokensSchema: SchemaFactory =
  SchemaFactory.createForClass(NFTToken);
