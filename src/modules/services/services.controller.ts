import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFiles,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    return this.servicesService.findAll({ search, category, status, isPublished });
  }

  @Get('seed')
  async seed() {
    await this.servicesService.seedDefaults();
    return { success: true, message: 'Default services seeded successfully' };
  }

  @Get(':identifier')
  async findOne(@Param('identifier') identifier: string) {
    return this.servicesService.findOne(identifier);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'showcase1Image', maxCount: 1 },
      { name: 'showcase2Image', maxCount: 1 },
      { name: 'icon', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createDto: CreateServiceDto,
    @UploadedFiles()
    files?: {
      showcase1Image?: Express.Multer.File[];
      showcase2Image?: Express.Multer.File[];
      icon?: Express.Multer.File[];
    },
  ) {
    return this.servicesService.create(createDto, files);
  }

  @Put(':identifier')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'showcase1Image', maxCount: 1 },
      { name: 'showcase2Image', maxCount: 1 },
      { name: 'icon', maxCount: 1 },
    ]),
  )
  async update(
    @Param('identifier') identifier: string,
    @Body() updateDto: UpdateServiceDto,
    @UploadedFiles()
    files?: {
      showcase1Image?: Express.Multer.File[];
      showcase2Image?: Express.Multer.File[];
      icon?: Express.Multer.File[];
    },
  ) {
    return this.servicesService.update(identifier, updateDto, files);
  }

  @Delete(':identifier')
  async remove(@Param('identifier') identifier: string) {
    return this.servicesService.remove(identifier);
  }
}
