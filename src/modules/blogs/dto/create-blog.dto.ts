import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { BlogStatus } from '../schemas/blog.schema';
import { Transform } from 'class-transformer';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty({ message: 'Blog title is required' })
  title: string;

  @IsString()
  @IsOptional()
  subtitle?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsNotEmpty({ message: 'Category is required' })
  category: string;

  @IsString()
  @IsNotEmpty({ message: 'Excerpt is required' })
  excerpt: string;

  @IsNotEmpty({ message: 'Content is required' })
  content: any;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsOptional()
  authorName?: string;

  @IsString()
  @IsOptional()
  authorRole?: string;

  @IsString()
  @IsOptional()
  authorBio?: string;

  @IsString()
  @IsOptional()
  readTime?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return false;
  })
  featured?: boolean;

  @IsOptional()
  tags?: any;

  @IsEnum(BlogStatus)
  @IsOptional()
  status?: BlogStatus;

  @IsOptional()
  publishedAt?: any;

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;

  // --- SEO & Content Suite Enhancements ---
  @IsString()
  @IsOptional()
  imageAltText?: string;

  @IsOptional()
  tableOfContents?: any;

  @IsOptional()
  internalLinks?: any;

  @IsOptional()
  externalLinks?: any;

  @IsString()
  @IsOptional()
  schemaMarkup?: string;

  @IsString()
  @IsOptional()
  ogTitle?: string;

  @IsString()
  @IsOptional()
  ogDescription?: string;

  @IsString()
  @IsOptional()
  ogImage?: string;

  @IsString()
  @IsOptional()
  twitterCard?: string;

  @IsString()
  @IsOptional()
  canonicalUrl?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false' || value === false) return false;
    return true;
  })
  isRobotsIndex?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false' || value === false) return false;
    return true;
  })
  isRobotsFollow?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'false' || value === false) return false;
    return true;
  })
  includeInSitemap?: boolean;

  @IsOptional()
  @Transform(({ value }) => Number(value) || 0.8)
  sitemapPriority?: number;

  @IsString()
  @IsOptional()
  sitemapChangeFreq?: string;
}
