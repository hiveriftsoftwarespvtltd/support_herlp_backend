import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type IndustryDocument = HydratedDocument<Industry>;

@Schema({ timestamps: true, collection: 'industries' })
export class Industry extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ trim: true, default: 'Part 1' })
  groupTitle: string;

  @Prop({ trim: true, default: '' })
  subtitle?: string;

  @Prop({ trim: true, default: '' })
  overview?: string;

  @Prop({ type: [String], default: [] })
  challenges: string[];

  @Prop({ type: [String], default: [] })
  solutions: string[];

  @Prop({ type: [String], default: [] })
  benefits: string[];

  @Prop({ type: [String], default: [] })
  supportedSoftwares: string[];

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ trim: true, default: '' })
  metaTitle?: string;

  @Prop({ trim: true, default: '' })
  metaDescription?: string;
}

export const IndustrySchema = SchemaFactory.createForClass(Industry);
