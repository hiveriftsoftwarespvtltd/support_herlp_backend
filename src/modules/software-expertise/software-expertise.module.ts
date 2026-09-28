import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SoftwareExpertise,
  SoftwareExpertiseSchema,
} from './schemas/software-expertise.schema';
import { SoftwareExpertiseController } from './software-expertise.controller';
import { SoftwareExpertiseService } from './software-expertise.service';
import { ImageUploadService } from '../../common/services/image-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SoftwareExpertise.name, schema: SoftwareExpertiseSchema },
    ]),
  ],
  controllers: [SoftwareExpertiseController],
  providers: [SoftwareExpertiseService, ImageUploadService],
  exports: [SoftwareExpertiseService, MongooseModule],
})
export class SoftwareExpertiseModule {}
