import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateConsultationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  companyName?: string;

  @IsNotEmpty()
  @IsEmail()
  workEmail: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  primaryService: string;

  @IsNotEmpty()
  @IsString()
  preferredTimeSlot: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @IsString()
  sourcePage?: string;
}
