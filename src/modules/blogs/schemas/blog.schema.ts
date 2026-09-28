import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type BlogDocument = HydratedDocument<Blog>;

export enum BlogStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Schema({ _id: false })
export class BlogAuthor {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: 'Senior Accounting Advisor' })
  role: string;

  @Prop({ trim: true, default: null })
  avatar?: string;

  @Prop({ trim: true, default: '' })
  bio?: string;
}

@Schema({ timestamps: true, collection: 'blogs' })
export class Blog extends Document {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ required: true, trim: true })
  excerpt: string;

  @Prop({ type: MongooseSchema.Types.Mixed, required: true })
  content: any;

  @Prop({ trim: true, default: null })
  coverImage?: string;

  @Prop({ default: false })
  featured: boolean;

  @Prop({ required: true, trim: true, default: 'Accounting & Tax' })
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: BlogAuthor, required: true })
  author: BlogAuthor;

  @Prop({ trim: true, default: '5 min read' })
  readTime: string;

  @Prop({
    type: String,
    enum: Object.values(BlogStatus),
    default: BlogStatus.PUBLISHED,
    index: true,
  })
  status: BlogStatus;

  @Prop({ default: Date.now })
  publishedAt: Date;

  @Prop({ default: 0 })
  viewsCount: number;

  @Prop({ trim: true, default: '' })
  metaTitle?: string;

  @Prop({ trim: true, default: '' })
  metaDescription?: string;

  @Prop({ type: [String], default: [] })
  metaKeywords: string[];
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
