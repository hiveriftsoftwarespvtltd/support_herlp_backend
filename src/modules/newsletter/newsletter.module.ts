import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  NewsletterSubscriber,
  NewsletterSubscriberSchema,
} from './schemas/newsletter-subscriber.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewsletterSubscriber.name, schema: NewsletterSubscriberSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class NewsletterModule {}
