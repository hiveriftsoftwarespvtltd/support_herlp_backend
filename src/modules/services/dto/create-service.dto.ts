import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty({ message: 'Service title is required' })
  title: string;

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
  category?: string;

  @IsString()
  @IsOptional()
  shortDescription?: string;

  @IsString()
  @IsOptional()
  introBadge?: string;

  @IsString()
  @IsOptional()
  introHeading?: string;

  @IsOptional()
  introParagraphs?: any;

  @IsString()
  @IsOptional()
  solutionsBadge?: string;

  @IsString()
  @IsOptional()
  solutionsTitle?: string;

  @IsOptional()
  leftCol?: any;

  @IsOptional()
  rightCol?: any;

  @IsString()
  @IsOptional()
  showcase1Badge?: string;

  @IsString()
  @IsOptional()
  showcase1Title?: string;

  @IsString()
  @IsOptional()
  showcase1Description?: string;

  @IsOptional()
  showcase1Checklist?: any;

  @IsString()
  @IsOptional()
  showcase1Note?: string;

  @IsString()
  @IsOptional()
  showcase1Image?: string;

  @IsString()
  @IsOptional()
  showcase2Badge?: string;

  @IsString()
  @IsOptional()
  showcase2Title?: string;

  @IsOptional()
  showcase2Paragraphs?: any;

  @IsString()
  @IsOptional()
  showcase2Image?: string;

  @IsString()
  @IsOptional()
  whyBadge?: string;

  @IsString()
  @IsOptional()
  whyTitle?: string;

  @IsOptional()
  whyReasons?: any;

  @IsString()
  @IsOptional()
  whyClosingNote?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => Number(value) || 0)
  displayOrder?: number;

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return true;
  })
  isPublished?: boolean;

  @IsString()
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  @IsOptional()
  metaKeywords?: any;

  @IsString()
  @IsOptional()
  canonicalUrl?: string;
}
