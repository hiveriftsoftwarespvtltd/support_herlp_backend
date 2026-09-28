import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type NewsletterSubscriberDocument = HydratedDocument<NewsletterSubscriber>;

export enum SubscriberStatus {
  ACTIVE = 'active',
  UNSUBSCRIBED = 'unsubscribed',
}

@Schema({ timestamps: true, collection: 'newsletter_subscribers' })
export class NewsletterSubscriber extends Document {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({
    type: String,
    enum: Object.values(SubscriberStatus),
    default: SubscriberStatus.ACTIVE,
    index: true,
  })
  status: SubscriberStatus;

  @Prop({ trim: true, default: 'website_footer' })
  source: string;

  @Prop({ default: Date.now })
  subscribedAt: Date;

  @Prop({ default: null })
  unsubscribedAt?: Date;
}

export const NewsletterSubscriberSchema = SchemaFactory.createForClass(NewsletterSubscriber);
