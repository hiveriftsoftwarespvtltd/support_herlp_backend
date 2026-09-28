import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateSoftwareDto {
  @IsString()
  @IsNotEmpty({ message: 'Software name is required' })
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  heroTitle?: string;

  @IsString()
  @IsOptional()
  heroSubtitle?: string;

  @IsString()
  @IsOptional()
  desc?: string;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  badgeTag?: string;

  @IsString()
  @IsOptional()
  introHeading?: string;

  @IsOptional()
  introParagraphs?: any;

  @IsOptional()
  highlights?: any;

  @IsOptional()
  featuresSection?: any;

  @IsOptional()
  showcases?: any;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return true;
  })
  isPublished?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value) || 0)
  displayOrder?: number;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;
}
