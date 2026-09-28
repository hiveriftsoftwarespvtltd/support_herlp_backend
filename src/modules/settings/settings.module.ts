import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SiteSetting, SiteSettingSchema } from './schemas/site-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SiteSetting.name, schema: SiteSettingSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SettingsModule {}
