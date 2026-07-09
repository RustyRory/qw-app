import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as fs from 'fs';
import * as path from 'path';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../common/enums';
import { DocumentsService } from './documents.service';

type StorageCb = (err: Error | null, value: string) => void;

interface MulterDiskStorageOptions {
  destination: (
    req: { params: Record<string, string> },
    file: unknown,
    cb: StorageCb,
  ) => void;
  filename: (
    req: unknown,
    file: { originalname: string },
    cb: StorageCb,
  ) => void;
}

interface MulterModule {
  diskStorage(options: MulterDiskStorageOptions): unknown;
}

interface MulterFile {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

interface RequestWithUser {
  user: { id: string; role: Role };
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const multerLib = require('multer') as MulterModule;

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload/:clientId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerLib.diskStorage({
        destination: (req, _file, cb) => {
          const dir = path.join('/uploads/clients', req.params.clientId);
          fs.mkdirSync(dir, { recursive: true });
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const ext = path.extname(file.originalname);
          cb(null, `${unique}${ext}`);
        },
      }),
    }),
  )
  upload(
    @Param('clientId') clientId: string,
    @UploadedFile() file: MulterFile,
    @Req() req: RequestWithUser,
  ) {
    return this.documentsService.upload(clientId, file, req.user);
  }

  @Get('file/:id')
  streamFile(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.documentsService.streamFile(id, req.user);
  }

  @Get(':clientId')
  findByClient(@Param('clientId') clientId: string) {
    return this.documentsService.findByClient(clientId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.documentsService.remove(id, req.user);
  }
}
