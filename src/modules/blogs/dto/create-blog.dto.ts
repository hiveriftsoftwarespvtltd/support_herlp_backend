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

  @IsString()
  @IsOptional()
  metaTitle?: string;

  @IsString()
  @IsOptional()
  metaDescription?: string;
}
