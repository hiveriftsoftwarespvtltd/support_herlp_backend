import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Blog, BlogDocument, BlogStatus } from './schemas/blog.schema';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { ImageUploadService } from '../../common/services/image-upload.service';
import { INITIAL_STATIC_BLOGS } from './data/initial-blogs.data';

@Injectable()
export class BlogsService implements OnModuleInit {
  constructor(
    @InjectModel(Blog.name) private readonly blogModel: Model<BlogDocument>,
    private readonly imageUploadService: ImageUploadService,
  ) {}

  /**
   * Automatically seed database with existing static blogs on server startup
   */
  async onModuleInit() {
    try {
      const count = await this.blogModel.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding initial static blogs into MongoDB...');
        await this.blogModel.insertMany(INITIAL_STATIC_BLOGS);
        console.log(`✅ Successfully seeded ${INITIAL_STATIC_BLOGS.length} blogs into MongoDB!`);
      }
    } catch (err: any) {
      console.error('Error seeding initial blogs:', err.message);
    }
  }

  /**
   * Get all blogs with search, category filtering and pagination
   */
  async findAll(query: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 50));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query.category && query.category !== 'All') {
      filter.category = query.category;
    }

    if (query.status && query.status !== 'All') {
      filter.status = query.status;
    }

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: regex },
        { excerpt: regex },
        { tags: regex },
        { category: regex },
        { slug: regex },
      ];
    }

    const [items, total] = await Promise.all([
      this.blogModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.blogModel.countDocuments(filter).exec(),
    ]);

    return {
      success: true,
      message: 'Blogs retrieved successfully',
      data: {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
    };
  }

  /**
   * Get single blog by slug or ID and increment views
   */
  async findOne(identifier: string) {
    const conditions: any[] = [{ slug: identifier }];
    if (Types.ObjectId.isValid(identifier)) {
      conditions.unshift({ _id: identifier });
    }

    const blog = await this.blogModel
      .findOneAndUpdate(
        { $or: conditions },
        { $inc: { viewsCount: 1 } },
        { new: true },
      )
      .exec();

    if (!blog) {
      throw new NotFoundException(
        `Blog article with identifier "${identifier}" not found`,
      );
    }

    return {
      success: true,
      message: 'Blog article retrieved successfully',
      data: blog,
    };
  }

  /**
   * Create a new blog post with optional auto-compressed image
   */
  async create(createBlogDto: CreateBlogDto, file?: Express.Multer.File) {
    let slug = createBlogDto.slug;
    if (!slug) {
      slug = createBlogDto.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Ensure unique slug
    const existing = await this.blogModel.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Process image with Sharp auto-compression if uploaded
    let coverImageUrl = createBlogDto.coverImage || '/blog/zoho-books-used-for.png';
    if (file) {
      coverImageUrl = await this.imageUploadService.processAndSaveImage(file);
    }

    // Parse content if stringified JSON
    let parsedContent = createBlogDto.content;
    if (typeof parsedContent === 'string') {
      try {
        parsedContent = JSON.parse(parsedContent);
      } catch {
        parsedContent = [{ type: 'paragraph', text: createBlogDto.content }];
      }
    }

    // Parse tags
    let tagsList: string[] = [];
    if (Array.isArray(createBlogDto.tags)) {
      tagsList = createBlogDto.tags;
    } else if (typeof createBlogDto.tags === 'string') {
      tagsList = createBlogDto.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    const newBlog = new this.blogModel({
      title: createBlogDto.title,
      slug,
      category: createBlogDto.category,
      excerpt: createBlogDto.excerpt,
      content: parsedContent,
      coverImage: coverImageUrl,
      featured: !!createBlogDto.featured,
      readTime: createBlogDto.readTime || '5 min read',
      tags: tagsList,
      author: {
        name: createBlogDto.authorName || 'Support Help',
        role: createBlogDto.authorRole || 'Certified Cloud Accounting Specialist',
        avatar: null,
      },
      status: createBlogDto.status || BlogStatus.PUBLISHED,
      publishedAt: new Date(),
      metaTitle: createBlogDto.metaTitle || createBlogDto.title,
      metaDescription: createBlogDto.metaDescription || createBlogDto.excerpt,
    });

    const saved = await newBlog.save();

    return {
      success: true,
      message: 'Blog article created successfully',
      data: saved,
    };
  }

  /**
   * Update existing blog post (supports lookup by _id or slug, with upsert fallback)
   */
  async update(
    identifier: string,
    updateBlogDto: UpdateBlogDto,
    file?: Express.Multer.File,
  ) {
    const conditions: any[] = [{ slug: identifier }];
    if (Types.ObjectId.isValid(identifier)) {
      conditions.unshift({ _id: identifier });
    }

    if (updateBlogDto.slug && updateBlogDto.slug !== identifier) {
      conditions.push({ slug: updateBlogDto.slug });
    }

    let blog = await this.blogModel.findOne({ $or: conditions });

    // If blog not found by ID (e.g. stale or deleted ID), upsert/create it seamlessly
    if (!blog) {
      if (updateBlogDto.title && updateBlogDto.category && updateBlogDto.excerpt) {
        return this.create(updateBlogDto as CreateBlogDto, file);
      }
      throw new NotFoundException(
        `Blog article with identifier "${identifier}" not found`,
      );
    }

    // Process new image if provided
    if (file) {
      const oldImage = blog.coverImage;
      const newImageUrl = await this.imageUploadService.processAndSaveImage(file);
      blog.coverImage = newImageUrl;
      if (oldImage) {
        this.imageUploadService.deleteImageFile(oldImage);
      }
    } else if (updateBlogDto.coverImage) {
      blog.coverImage = updateBlogDto.coverImage;
    }

    if (updateBlogDto.title) blog.title = updateBlogDto.title;
    if (updateBlogDto.category) blog.category = updateBlogDto.category;
    if (updateBlogDto.excerpt) blog.excerpt = updateBlogDto.excerpt;
    if (updateBlogDto.readTime) blog.readTime = updateBlogDto.readTime;
    if (updateBlogDto.featured !== undefined) blog.featured = !!updateBlogDto.featured;
    if (updateBlogDto.status) blog.status = updateBlogDto.status;

    if (updateBlogDto.content) {
      let parsedContent = updateBlogDto.content;
      if (typeof parsedContent === 'string') {
        try {
          parsedContent = JSON.parse(parsedContent);
        } catch {
          parsedContent = [{ type: 'paragraph', text: updateBlogDto.content }];
        }
      }
      blog.content = parsedContent;
    }

    if (updateBlogDto.tags) {
      if (Array.isArray(updateBlogDto.tags)) {
        blog.tags = updateBlogDto.tags;
      } else if (typeof updateBlogDto.tags === 'string') {
        blog.tags = updateBlogDto.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    if (updateBlogDto.authorName || updateBlogDto.authorRole) {
      blog.author = {
        name: updateBlogDto.authorName || blog.author?.name || 'Support Help',
        role: updateBlogDto.authorRole || blog.author?.role || 'Senior Advisor',
        avatar: blog.author?.avatar,
      };
    }

    const updated = await blog.save();

    return {
      success: true,
      message: 'Blog article updated successfully',
      data: updated,
    };
  }

  /**
   * Delete blog post and its uploaded image (supports lookup by _id or slug)
   */
  async remove(identifier: string) {
    const conditions: any[] = [{ slug: identifier }];
    if (Types.ObjectId.isValid(identifier)) {
      conditions.unshift({ _id: identifier });
    }

    const blog = await this.blogModel.findOneAndDelete({ $or: conditions });
    if (!blog) {
      return {
        success: true,
        message: 'Blog article already removed or does not exist',
        data: { id: identifier },
      };
    }

    if (blog.coverImage) {
      this.imageUploadService.deleteImageFile(blog.coverImage);
    }

    return {
      success: true,
      message: 'Blog article deleted successfully',
      data: { id: blog._id },
    };
  }
}
