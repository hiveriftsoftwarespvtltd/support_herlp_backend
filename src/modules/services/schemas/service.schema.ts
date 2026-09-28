import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ _id: false })
export class ServiceFaq {
  @Prop({ required: true, trim: true })
  question: string;

  @Prop({ required: true, trim: true })
  answer: string;
}

@Schema({ timestamps: true, collection: 'services' })
export class Service extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ required: true, trim: true, default: 'Core Services' })
  category: string;

  @Prop({ trim: true, default: '' })
  shortDescription: string;

  @Prop({ trim: true, default: '' })
  heroTitle?: string;

  @Prop({ trim: true, default: '' })
  heroSubtitle?: string;

  @Prop({ trim: true, default: '' })
  overview?: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: [String], default: [] })
  deliverables: string[];

  @Prop({ type: [String], default: [] })
  benefits: string[];

  @Prop({ type: [ServiceFaq], default: [] })
  faqs: ServiceFaq[];

  @Prop({ trim: true, default: null })
  icon?: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ trim: true, default: '' })
  metaTitle?: string;

  @Prop({ trim: true, default: '' })
  metaDescription?: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
