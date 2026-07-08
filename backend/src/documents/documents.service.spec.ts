import { NotFoundException, StreamableFile } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { Role } from '../common/enums';

jest.mock('fs');

const COLLAB: { id: string; role: Role } = {
  id: 'user-1',
  role: Role.COLLABORATEUR,
};
const ADMIN: { id: string; role: Role } = {
  id: 'user-2',
  role: Role.ADMIN,
};

const makeDoc = (override: Partial<Document> = {}): Document =>
  ({
    id: 'doc-1',
    nomFichier: 'rapport.pdf',
    cheminStockage: '/uploads/clients/client-1/123-rapport.pdf',
    typeMime: 'application/pdf',
    taille: 20480,
    client: { id: 'client-1' },
    ...override,
  }) as Document;

describe('DocumentsService', () => {
  let service: DocumentsService;

  const docRepoMock = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((data) => data),
    remove: jest.fn(),
  };

  const auditRepoMock = {
    save: jest.fn(),
    create: jest.fn((data) => data),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.createReadStream as jest.Mock).mockReturnValue({ pipe: jest.fn() });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: getRepositoryToken(Document), useValue: docRepoMock },
        { provide: getRepositoryToken(AuditLog), useValue: auditRepoMock },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  // ------------------------------------------------------------------ upload
  describe('upload', () => {
    const file = {
      originalname: 'rapport.pdf',
      mimetype: 'application/pdf',
      size: 20480,
      path: '/uploads/clients/client-1/123-rapport.pdf',
    };

    it('persiste les métadonnées avec le bon clientId', async () => {
      docRepoMock.save.mockResolvedValue({ id: 'doc-new', ...file });

      await service.upload('client-1', file, COLLAB);

      expect(docRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          nomFichier: 'rapport.pdf',
          typeMime: 'application/pdf',
          taille: 20480,
          cheminStockage: file.path,
          client: { id: 'client-1' },
          utilisateur: { id: COLLAB.id },
        }),
      );
    });

    it('enregistre un audit CREATE', async () => {
      docRepoMock.save.mockResolvedValue({ id: 'doc-new' });

      await service.upload('client-1', file, COLLAB);

      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          ressource: 'Document',
          utilisateur: { id: COLLAB.id },
        }),
      );
    });
  });

  // ------------------------------------------------------------ findByClient
  describe('findByClient', () => {
    it('retourne les documents du client triés par date décroissante', async () => {
      const docs = [makeDoc(), makeDoc({ id: 'doc-2' })];
      docRepoMock.find.mockResolvedValue(docs);

      const result = await service.findByClient('client-1');

      expect(result).toBe(docs);
      expect(docRepoMock.find).toHaveBeenCalledWith({
        where: { client: { id: 'client-1' } },
        order: { createdAt: 'DESC' },
      });
    });
  });

  // ------------------------------------------------------------- streamFile
  describe('streamFile', () => {
    it('retourne un StreamableFile et enregistre un audit READ', async () => {
      docRepoMock.findOne.mockResolvedValue(makeDoc());

      const result = await service.streamFile('doc-1', COLLAB);

      expect(result).toBeInstanceOf(StreamableFile);
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.READ,
          ressource: 'Document',
          ressourceId: 'doc-1',
          utilisateur: { id: COLLAB.id },
        }),
      );
    });

    it('lève NotFoundException si le document est introuvable en base', async () => {
      docRepoMock.findOne.mockResolvedValue(null);

      await expect(service.streamFile('inexistant', COLLAB)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('lève NotFoundException si le fichier est absent du disque', async () => {
      docRepoMock.findOne.mockResolvedValue(makeDoc());
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(service.streamFile('doc-1', COLLAB)).rejects.toThrow(
        NotFoundException,
      );
      expect(auditRepoMock.save).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------ remove
  describe('remove', () => {
    it('supprime le fichier du disque, la ligne en base et enregistre un audit DELETE', async () => {
      const doc = makeDoc();
      docRepoMock.findOneBy.mockResolvedValue(doc);
      docRepoMock.remove.mockResolvedValue(doc);

      await service.remove('doc-1', ADMIN);

      expect(fs.unlinkSync).toHaveBeenCalledWith(doc.cheminStockage);
      expect(docRepoMock.remove).toHaveBeenCalledWith(doc);
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.DELETE,
          ressource: 'Document',
          ressourceId: 'doc-1',
          details: { nomFichier: doc.nomFichier },
        }),
      );
    });

    it("ne tente pas d'unlink si le fichier est absent du disque", async () => {
      docRepoMock.findOneBy.mockResolvedValue(makeDoc());
      (fs.existsSync as jest.Mock).mockReturnValue(false);
      docRepoMock.remove.mockResolvedValue({});

      await service.remove('doc-1', ADMIN);

      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(docRepoMock.remove).toHaveBeenCalled();
    });

    it('lève NotFoundException si le document est introuvable', async () => {
      docRepoMock.findOneBy.mockResolvedValue(null);

      await expect(service.remove('inexistant', ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
