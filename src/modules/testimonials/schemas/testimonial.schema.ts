import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type TestimonialDocument = HydratedDocument<Testimonial>;

@Schema({ timestamps: true, collection: 'testimonials' })
export class Testimonial extends Document {
  @Prop({ required: true, trim: true })
  clientName: string;

  @Prop({ trim: true, default: '' })
  company: string;

  @Prop({ trim: true, default: '' })
  designation?: string;

  @Prop({ required: true, trim: true })
  reviewText: string;

  @Prop({ default: 5, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true, default: null })
  avatar?: string;

  @Prop({ trim: true, default: null })
  clientLogo?: string;

  @Prop({ trim: true, default: 'General Bookkeeping' })
  serviceUsed?: string;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({ default: 0 })
  displayOrder: number;
}

export const TestimonialSchema = SchemaFactory.createForClass(Testimonial);
