import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type InquiryDocument = HydratedDocument<Inquiry>;

export enum InquiryStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  REPLIED = 'replied',
  CONVERTED = 'converted',
  CLOSED = 'closed',
}

@Schema({ timestamps: true, collection: 'inquiries' })
export class Inquiry extends Document {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ trim: true, default: null })
  phone?: string;

  @Prop({ trim: true, default: '' })
  company?: string;

  @Prop({ trim: true, default: '' })
  service?: string;

  @Prop({ trim: true, default: '' })
  softwarePreference?: string;

  @Prop({ required: true, trim: true })
  message: string;

  @Prop({
    type: String,
    enum: Object.values(InquiryStatus),
    default: InquiryStatus.NEW,
    index: true,
  })
  status: InquiryStatus;

  @Prop({ trim: true, default: '/contact-us' })
  sourcePage?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, default: null })
  assignedTo?: User;

  @Prop({ trim: true, default: '' })
  internalNotes?: string;

  @Prop({ trim: true, default: null })
  ipAddress?: string;
}

export const InquirySchema = SchemaFactory.createForClass(Inquiry);
