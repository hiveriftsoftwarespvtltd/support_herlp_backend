import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  STAFF = 'staff',
  ACCOUNTANT = 'accountant',
  CLIENT = 'client',
}

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ trim: true, default: null })
  phone?: string;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STAFF,
  })
  role: UserRole;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: null })
  lastLoginAt?: Date;

  @Prop({ select: false, default: null })
  refreshToken?: string;

  @Prop({ select: false, default: null })
  resetPasswordToken?: string;

  @Prop({ select: false, default: null })
  resetPasswordExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
