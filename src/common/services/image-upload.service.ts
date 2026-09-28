import { Injectable, BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';

@Injectable()
export class ImageUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads', 'blogs');

  constructor() {
    // Ensure uploads/blogs directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Process and auto-compress uploaded image buffer using Sharp
   * @param file Express Multer File
   * @returns Relative URL to access the compressed image
   */
  async processAndSaveImage(file: Express.Multer.File): Promise<string> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No image file provided');
    }

    // Allowed image mimetypes
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid image format. Allowed formats: JPEG, PNG, WEBP, AVIF, GIF',
      );
    }

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const outputFilename = `blog-${uniqueSuffix}.webp`;
    const outputPath = path.join(this.uploadDir, outputFilename);

    try {
      // Auto compress and optimize:
      // 1. Auto-orient according to EXIF
      // 2. Max width 1200px (without enlargement)
      // 3. Compress to WebP with 80% quality (cuts 70-90% file size without visible loss)
      await sharp(file.buffer)
        .rotate()
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 })
        .toFile(outputPath);

      // Return static accessible URL
      return `/uploads/blogs/${outputFilename}`;
    } catch (err: any) {
      throw new BadRequestException(`Image optimization failed: ${err.message}`);
    }
  }

  /**
   * Remove previous image file if replaced or deleted
   */
  deleteImageFile(relativeUrl: string): void {
    if (!relativeUrl || !relativeUrl.startsWith('/uploads/blogs/')) {
      return;
    }
    const filename = path.basename(relativeUrl);
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch {
        // Ignore deletion errors for missing files
      }
    }
  }
}
