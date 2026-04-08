import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import { DocumentResponseDto } from './dto/document-response.dto';
import { AuthUser } from 'src/modules/auth/decorator/auth-user.decorator';
import type { AuthUser as AuthUserPayload } from 'src/modules/auth/interfaces/auth-user.interface';
import { UsersService } from 'src/modules/users/users.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { PermissionsGuard } from 'src/modules/auth/guards/permissions.guard';

const ALLOWED_MIME_TYPES = ['application/pdf', 'text/plain', 'text/markdown'];
const MAX_FILE_SIZE_MB = 20;

@ApiTags('Documents')
@ApiBearerAuth('JWT')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Upload a policy document (PDF / TXT / MD) and ingest into Chroma' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        collection: { type: 'string', example: 'hr_policies' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, type: DocumentResponseDto })
  @HttpCode(HttpStatus.CREATED)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: 'uploads',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error('Only PDF, TXT and Markdown files are allowed.'), false);
        }
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('collection') collection: string = 'hr_policies',
    @AuthUser() authUser: AuthUserPayload,
  ): Promise<DocumentResponseDto> {
    const user = await this.usersService.findById(authUser.userId);
    return this.documentsService.upload(file, collection, user!);
  }

  @ApiOperation({ summary: 'List all uploaded policy documents' })
  @ApiResponse({ status: 200, type: [DocumentResponseDto] })
  @Get()
  findAll(): Promise<DocumentResponseDto[]> {
    return this.documentsService.findAll();
  }

  @ApiOperation({ summary: 'Get a single document by id' })
  @ApiResponse({ status: 200, type: DocumentResponseDto })
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<DocumentResponseDto> {
    return this.documentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Delete a document and remove its vectors from Chroma' })
  @ApiResponse({ status: 200, description: 'Document deleted' })
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ deleted: boolean }> {
    return this.documentsService.remove(id);
  }
}
