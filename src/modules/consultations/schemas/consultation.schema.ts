import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type ConsultationDocument = HydratedDocument<Consultation>;

export enum ConsultationStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  IN_REVIEW = 'in_review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true, collection: 'consultations' })
export class Consultation extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true, default: null })
  companyName?: string;

  @Prop({ required: true, lowercase: true, trim: true, index: true })
  workEmail: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  primaryService: string;

  @Prop({ required: true, trim: true })
  preferredTimeSlot: string;

  @Prop({ trim: true, default: '' })
  overview?: string;

  @Prop({
    type: String,
    enum: Object.values(ConsultationStatus),
    default: ConsultationStatus.PENDING,
    index: true,
  })
  status: ConsultationStatus;

  @Prop({ default: null })
  scheduledDate?: Date;

  @Prop({ trim: true, default: null })
  meetingLink?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, default: null })
  assignedTo?: User;

  @Prop({ trim: true, default: '' })
  internalNotes?: string;

  @Prop({ trim: true, default: '/free-consultation' })
  sourcePage?: string;

  @Prop({ trim: true, default: null })
  ipAddress?: string;
}

export const ConsultationSchema = SchemaFactory.createForClass(Consultation);
