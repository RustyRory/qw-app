import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { Document } from './entities/document.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { Client } from '../clients/entities/client.entity';
import { User, UserRole } from '../users/entities/user.entity';

type AuthUser = { id: string; role: UserRole };

interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  async upload(
    clientId: string,
    file: UploadedFile,
    authUser: AuthUser,
  ): Promise<Document> {
    const doc = await this.docRepo.save(
      this.docRepo.create({
        nomFichier: file.originalname,
        cheminStockage: file.path,
        typeMime: file.mimetype,
        taille: file.size,
        client: { id: clientId } as Client,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.CREATE,
        entiteType: 'Document',
        entiteId: doc.id,
        details: { nomFichier: file.originalname, taille: file.size },
        utilisateur: { id: authUser.id } as User,
      }),
    );

    return doc;
  }

  findByClient(clientId: string): Promise<Document[]> {
    return this.docRepo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async streamFile(id: string, authUser: AuthUser): Promise<StreamableFile> {
    const doc = await this.docRepo.findOne({ where: { id } });
    if (!doc) throw new NotFoundException('Document introuvable');

    if (!fs.existsSync(doc.cheminStockage)) {
      throw new NotFoundException('Fichier introuvable sur le serveur');
    }

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.READ,
        entiteType: 'Document',
        entiteId: id,
        details: null,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    return new StreamableFile(fs.createReadStream(doc.cheminStockage), {
      type: doc.typeMime,
      disposition: `attachment; filename="${doc.nomFichier}"`,
    });
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    const doc = await this.docRepo.findOneBy({ id });
    if (!doc) throw new NotFoundException('Document introuvable');

    if (fs.existsSync(doc.cheminStockage)) {
      fs.unlinkSync(doc.cheminStockage);
    }

    await this.docRepo.remove(doc);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.DELETE,
        entiteType: 'Document',
        entiteId: id,
        details: { nomFichier: doc.nomFichier },
        utilisateur: { id: authUser.id } as User,
      }),
    );
  }
}
