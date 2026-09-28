import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Consultation,
  ConsultationSchema,
} from './schemas/consultation.schema';
import { ConsultationsService } from './consultations.service';
import { ConsultationsController } from './consultations.controller';
import { MailService } from '../../common/services/mail.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Consultation.name, schema: ConsultationSchema },
    ]),
  ],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, MailService],
  exports: [ConsultationsService, MongooseModule],
})
export class ConsultationsModule {}
