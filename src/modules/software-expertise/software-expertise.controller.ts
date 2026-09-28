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
import { SoftwareExpertiseService } from './software-expertise.service';
import { CreateSoftwareDto } from './dto/create-software.dto';
import { UpdateSoftwareDto } from './dto/update-software.dto';

@Controller('software-expertise')
export class SoftwareExpertiseController {
  constructor(
    private readonly softwareService: SoftwareExpertiseService,
  ) {}

  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('isPublished') isPublished?: string,
  ) {
    return this.softwareService.findAll({ search, isPublished });
  }

  @Get(':identifier')
  async findOne(@Param('identifier') identifier: string) {
    return this.softwareService.findOne(identifier);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'badge', maxCount: 1 },
      { name: 'showcaseImage', maxCount: 1 },
    ]),
  )
  async create(
    @Body() createDto: CreateSoftwareDto,
    @UploadedFiles()
    files?: {
      badge?: Express.Multer.File[];
      showcaseImage?: Express.Multer.File[];
    },
  ) {
    return this.softwareService.create(createDto, files);
  }

  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'badge', maxCount: 1 },
      { name: 'showcaseImage', maxCount: 1 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateSoftwareDto,
    @UploadedFiles()
    files?: {
      badge?: Express.Multer.File[];
      showcaseImage?: Express.Multer.File[];
    },
  ) {
    return this.softwareService.update(id, updateDto, files);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.softwareService.remove(id);
  }
}
