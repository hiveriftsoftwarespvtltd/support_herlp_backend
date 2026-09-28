import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type SiteSettingDocument = HydratedDocument<SiteSetting>;

@Schema({ _id: false })
export class AddressSetting {
  @Prop({ trim: true, default: '34175 Oakdale St.' })
  street: string;

  @Prop({ trim: true, default: 'Livonia' })
  city: string;

  @Prop({ trim: true, default: 'Michigan' })
  state: string;

  @Prop({ trim: true, default: '48154' })
  zip: string;

  @Prop({ trim: true, default: 'USA' })
  country: string;

  @Prop({ trim: true, default: '34175 Oakdale St., Livonia, Michigan 48154' })
  full: string;
}

@Schema({ _id: false })
export class SocialLinksSetting {
  @Prop({ trim: true, default: 'https://www.facebook.com' })
  facebook: string;

  @Prop({ trim: true, default: 'https://twitter.com' })
  twitter: string;

  @Prop({ trim: true, default: 'https://www.linkedin.com' })
  linkedin: string;

  @Prop({ trim: true, default: '' })
  instagram?: string;

  @Prop({ trim: true, default: '' })
  youtube?: string;
}

@Schema({ timestamps: true, collection: 'site_settings' })
export class SiteSetting extends Document {
  @Prop({ required: true, unique: true, default: 'main_config' })
  settingKey: string;

  @Prop({ trim: true, default: 'Support Help' })
  siteName: string;

  @Prop({ trim: true, default: 'Contact@Supporthelp.online' })
  email: string;

  @Prop({ trim: true, default: '+18003795250' })
  phoneTel: string;

  @Prop({ trim: true, default: '+1 (800) 379-5250' })
  phoneDisplay: string;

  @Prop({
    trim: true,
    default:
      'Kick Start Your Accounting Journey, We Help You to Start from Scratch',
  })
  announcementText: string;

  @Prop({ trim: true, default: '/free-consultation' })
  consultationUrl: string;

  @Prop({ type: AddressSetting, default: () => ({}) })
  address: AddressSetting;

  @Prop({ type: SocialLinksSetting, default: () => ({}) })
  socialLinks: SocialLinksSetting;

  @Prop({ trim: true, default: 'Mon - Fri, 9am - 6pm EST' })
  businessHours: string;

  @Prop({ default: false })
  maintenanceMode: boolean;
}

export const SiteSettingSchema = SchemaFactory.createForClass(SiteSetting);
