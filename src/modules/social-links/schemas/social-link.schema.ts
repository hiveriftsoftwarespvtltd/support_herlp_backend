import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type SocialLinkDocument = HydratedDocument<SocialLink>;

@Schema({ timestamps: true, collection: 'social_links' })
export class SocialLink extends Document {
  @Prop({ required: true, trim: true })
  platform: string; // 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'whatsapp', 'pinterest', 'other'

  @Prop({ required: true, trim: true })
  title: string; // 'Facebook', 'LinkedIn', etc.

  @Prop({ required: true, trim: true })
  url: string; // Target URL e.g. 'https://facebook.com/supporthelp'

  @Prop({ trim: true, default: '' })
  icon?: string; // 'facebook', 'twitter', 'linkedin', 'instagram', 'youtube', 'whatsapp', 'pinterest', 'globe'

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 1 })
  displayOrder: number;
}

export const SocialLinkSchema = SchemaFactory.createForClass(SocialLink);
SocialLinkSchema.index({ platform: 1 });
SocialLinkSchema.index({ isActive: 1, displayOrder: 1 });
