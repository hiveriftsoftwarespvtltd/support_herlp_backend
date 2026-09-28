import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Industry, IndustrySchema } from './schemas/industry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Industry.name, schema: IndustrySchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class IndustriesModule {}
