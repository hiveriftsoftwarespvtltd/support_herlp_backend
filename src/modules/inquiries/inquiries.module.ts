import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Inquiry, InquirySchema } from './schemas/inquiry.schema';
import { InquiriesService } from './inquiries.service';
import { InquiriesController } from './inquiries.controller';
import { MailService } from '../../common/services/mail.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Inquiry.name, schema: InquirySchema }]),
  ],
  controllers: [InquiriesController],
  providers: [InquiriesService, MailService],
  exports: [InquiriesService, MongooseModule],
})
export class InquiriesModule {}
