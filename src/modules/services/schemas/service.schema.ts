import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ServiceDocument = HydratedDocument<Service>;

@Schema({ timestamps: true, collection: 'services' })
export class Service extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ trim: true, default: '' })
  heroTitle?: string;

  @Prop({ trim: true, default: '' })
  heroSubtitle?: string;

  @Prop({ required: true, trim: true, default: 'Core Services' })
  category: string;

  @Prop({ trim: true, default: '' })
  shortDescription?: string;

  @Prop({ trim: true, default: 'Specialized Industry Practice' })
  introBadge?: string;

  @Prop({ trim: true, default: '' })
  introHeading?: string;

  @Prop({ type: [String], default: [] })
  introParagraphs: string[];

  // Solutions / Deliverables Grid (2 columns or list of cards)
  @Prop({ trim: true, default: 'Comprehensive Deliverables' })
  solutionsBadge?: string;

  @Prop({ trim: true, default: '' })
  solutionsTitle?: string;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  leftCol: Array<{ title: string; desc: string }>;

  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] })
  rightCol: Array<{ title: string; desc: string }>;

  // Showcase 1 (Strategic Scope / Photo)
  @Prop({ trim: true, default: 'Strategic Focus' })
  showcase1Badge?: string;

  @Prop({ trim: true, default: '' })
  showcase1Title?: string;

  @Prop({ trim: true, default: '' })
  showcase1Description?: string;

  @Prop({ type: [String], default: [] })
  showcase1Checklist?: string[];

  @Prop({ trim: true, default: '' })
  showcase1Note?: string;

  @Prop({ trim: true, default: null })
  showcase1Image?: string;

  // Showcase 2 (Operational Advantages / Photo)
  @Prop({ trim: true, default: 'Tailored Compliance' })
  showcase2Badge?: string;

  @Prop({ trim: true, default: '' })
  showcase2Title?: string;

  @Prop({ type: [String], default: [] })
  showcase2Paragraphs?: string[];

  @Prop({ trim: true, default: null })
  showcase2Image?: string;

  // Why Choose Us
  @Prop({ trim: true, default: 'Value Driven Assurance' })
  whyBadge?: string;

  @Prop({ trim: true, default: '' })
  whyTitle?: string;

  @Prop({ type: [String], default: [] })
  whyReasons?: string[];

  @Prop({ trim: true, default: '' })
  whyClosingNote?: string;

  @Prop({ trim: true, default: null })
  icon?: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ trim: true, default: 'published' })
  status: string; // 'published' | 'draft'

  @Prop({ trim: true, default: '' })
  metaTitle?: string;

  @Prop({ trim: true, default: '' })
  metaDescription?: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];

  @Prop({ trim: true, default: '' })
  canonicalUrl?: string;
}

export const ServiceSchema = SchemaFactory.createForClass(Service);
