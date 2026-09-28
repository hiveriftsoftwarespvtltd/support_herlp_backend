import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ timestamps: true, collection: 'audit_logs' })
export class AuditLog extends Document {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, default: null, index: true })
  userId?: User;

  @Prop({ trim: true, default: null })
  userEmail?: string;

  @Prop({ required: true, trim: true, index: true })
  action: string;

  @Prop({ required: true, trim: true, index: true })
  module: string;

  @Prop({ trim: true, default: null })
  recordId?: string;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  details: Record<string, any>;

  @Prop({ trim: true, default: null })
  ipAddress?: string;

  @Prop({ trim: true, default: null })
  userAgent?: string;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
