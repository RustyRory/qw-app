import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { Document } from './entities/document.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { User } from '../users/entities/user.entity';
import { Role, TypeDocument } from '../common/enums';
import { ObligationsService } from '../obligations/obligations.service';
import {
  CibleDossier,
  DOCUMENTS_ROOT,
  EXTENSIONS_AUTORISEES,
  TAILLE_MAX_DOCUMENT,
  TYPE_DOCUMENT_FICHIER,
  cheminRelatifDocument,
} from '../common/storage';
import { UploadDocumentDto } from './dto/upload-document.dto';

type AuthUser = { id: string; role: Role };

export interface FichierRecu {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

// Rôles autorisés à supprimer n'importe quel document (le déposant peut
// toujours supprimer le sien).
const ROLES_SUPPRESSION: Role[] = [
  Role.RESPONSABLE,
  Role.EXPERT_COMPTABLE,
  Role.ADMIN,
];

// Content-Disposition compatible avec les noms accentués (RFC 5987).
function contentDisposition(nom: string): string {
  const ascii = nom.replace(/[^\x20-\x7e]/g, '_').replace(/"/g, '');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nom)}`;
}

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
    @InjectRepository(Client)
    private readonly clientRepo: Repository<Client>,
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    private readonly obligationsService: ObligationsService,
  ) {}

  private async proprietaire(
    cible: CibleDossier,
    id: string,
  ): Promise<{ ref: string; nom: string }> {
    if (cible === 'client') {
      const c = await this.clientRepo.findOneBy({ id });
      if (!c) throw new NotFoundException('Client introuvable');
      return { ref: c.ref, nom: c.raisonSociale };
    }
    const p = await this.prospectRepo.findOneBy({ id });
    if (!p) throw new NotFoundException('Prospect introuvable');
    return { ref: p.ref, nom: p.nom };
  }

  // Chemin relatif libre dans le dossier du propriétaire : ajoute -2, -3…
  // si un document du même type a déjà été déposé le même jour.
  private async cheminRelatifLibre(
    params: Parameters<typeof cheminRelatifDocument>[0],
  ): Promise<string> {
    for (let suffixe = 1; ; suffixe++) {
      const candidat = cheminRelatifDocument({ ...params, suffixe });
      const existe = await this.docRepo.exists({
        where: { cheminRelatif: candidat },
        withDeleted: true,
      });
      if (!existe) return candidat;
    }
  }

  async upload(
    cible: CibleDossier,
    proprietaireId: string,
    file: FichierRecu | undefined,
    authUser: AuthUser,
    dto: UploadDocumentDto,
  ): Promise<Document> {
    if (!file) throw new BadRequestException('Aucun fichier reçu');
    const extension = path.extname(file.originalname).toLowerCase();
    const typeMime = EXTENSIONS_AUTORISEES[extension];
    if (!typeMime) {
      throw new BadRequestException(
        'Format non accepté (PDF, JPG, PNG, Word ou Excel uniquement)',
      );
    }
    if (file.size > TAILLE_MAX_DOCUMENT) {
      throw new BadRequestException('Fichier trop volumineux (20 Mo maximum)');
    }

    const { ref, nom } = await this.proprietaire(cible, proprietaireId);
    const type = dto.type ?? TypeDocument.AUTRE;
    const cheminRelatif = await this.cheminRelatifLibre({
      cible,
      ref,
      nom,
      libelleType: TYPE_DOCUMENT_FICHIER[type],
      extension,
    });

    const id = randomUUID();
    fs.mkdirSync(DOCUMENTS_ROOT, { recursive: true });
    const cheminStockage = path.join(DOCUMENTS_ROOT, `${id}${extension}`);
    fs.writeFileSync(cheminStockage, file.buffer);

    let doc: Document;
    try {
      doc = await this.docRepo.save(
        this.docRepo.create({
          id,
          type,
          nomFichier: path.posix.basename(cheminRelatif),
          nomOriginal: file.originalname.slice(0, 255),
          cheminRelatif,
          cheminStockage,
          typeMime,
          taille: file.size,
          dateExpiration: dto.dateExpiration ?? null,
          client: cible === 'client' ? { id: proprietaireId } : null,
          prospect: cible === 'prospect' ? { id: proprietaireId } : null,
          utilisateur: { id: authUser.id } as User,
          contact: dto.contactId ? { id: dto.contactId } : null,
          mission: dto.missionId ? { id: dto.missionId } : null,
          planningEtape: dto.planningEtapeId
            ? { id: dto.planningEtapeId }
            : null,
          operationSensible: dto.operationSensibleId
            ? { id: dto.operationSensibleId }
            : null,
        }),
      );
    } catch (err) {
      fs.rmSync(cheminStockage, { force: true });
      throw err;
    }

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.CREATE,
        ressource: 'Document',
        ressourceId: doc.id,
        details: {
          nomFichier: doc.nomFichier,
          nomOriginal: doc.nomOriginal,
          taille: file.size,
        },
        utilisateur: { id: authUser.id } as User,
      }),
    );

    if (cible === 'client') {
      await this.obligationsService.synchroniserPourClient(proprietaireId);
    }

    return doc;
  }

  findByClient(clientId: string): Promise<Document[]> {
    return this.docRepo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
      relations: [
        'utilisateur',
        'contact',
        'mission',
        'planningEtape',
        'operationSensible',
      ],
    });
  }

  findByProspect(prospectId: string): Promise<Document[]> {
    return this.docRepo.find({
      where: { prospect: { id: prospectId } },
      order: { createdAt: 'DESC' },
      relations: ['utilisateur'],
    });
  }

  findAllForSync(): Promise<Document[]> {
    return this.docRepo.find({
      select: { id: true, nomFichier: true, cheminRelatif: true },
      order: { createdAt: 'ASC' },
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
        ressource: 'Document',
        ressourceId: id,
        details: null,
        utilisateur: { id: authUser.id } as User,
      }),
    );

    return new StreamableFile(fs.createReadStream(doc.cheminStockage), {
      type: doc.typeMime,
      disposition: contentDisposition(doc.nomFichier),
    });
  }

  async remove(id: string, authUser: AuthUser): Promise<void> {
    const doc = await this.docRepo.findOne({
      where: { id },
      relations: ['client', 'utilisateur'],
    });
    if (!doc) throw new NotFoundException('Document introuvable');
    if (
      doc.utilisateur?.id !== authUser.id &&
      !ROLES_SUPPRESSION.includes(authUser.role)
    ) {
      throw new ForbiddenException(
        'Seul le déposant, un responsable, un expert-comptable ou un admin peut supprimer ce document',
      );
    }

    // Soft delete : le fichier est conservé sur disque pour une éventuelle
    // restauration ou un contrôle a posteriori.
    const clientId = doc.client?.id ?? null;
    await this.docRepo.softRemove(doc);

    await this.auditRepo.save(
      this.auditRepo.create({
        action: AuditAction.DELETE,
        ressource: 'Document',
        ressourceId: id,
        details: { nomFichier: doc.nomFichier },
        utilisateur: { id: authUser.id } as User,
      }),
    );

    if (clientId) {
      await this.obligationsService.synchroniserPourClient(clientId);
    }
  }
}
