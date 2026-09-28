import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type SoftwareExpertiseDocument = HydratedDocument<SoftwareExpertise>;

@Schema({ timestamps: true, collection: 'software_expertises' })
export class SoftwareExpertise extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ trim: true, default: '' })
  heroTitle: string;

  @Prop({ trim: true, default: '' })
  heroSubtitle?: string;

  @Prop({ trim: true, default: '' })
  desc: string;

  @Prop({ trim: true, default: '/software/zohobooks_badge.png' })
  badge?: string;

  @Prop({ trim: true, default: 'Platform Proficiency & Advisory' })
  badgeTag?: string;

  @Prop({ trim: true, default: '' })
  introHeading?: string;

  @Prop({ type: [String], default: [] })
  introParagraphs: string[];

  @Prop({
    type: [String],
    default: [
      'Automated Daily Feeds',
      'Multi-Currency Ledgers',
      'Real-Time MIS Reports',
    ],
  })
  highlights?: string[];

  @Prop({ type: Object, default: {} })
  featuresSection?: {
    title?: string;
    tag?: string;
    items?: Array<{ title: string; desc: string }>;
    leftCol?: Array<{ title: string; desc: string }>;
    rightCol?: Array<{ title: string; desc: string }>;
  };

  @Prop({ type: Array, default: [] })
  showcases?: Array<{
    title: string;
    tag?: string;
    bullets?: string[];
    paragraphs?: string[];
    image?: string;
    imagePosition?: string;
  }>;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ trim: true, default: '' })
  metaTitle?: string;

  @Prop({ trim: true, default: '' })
  metaDescription?: string;
}

export const SoftwareExpertiseSchema =
  SchemaFactory.createForClass(SoftwareExpertise);
