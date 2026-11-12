import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as fs from 'fs';
import { DocumentsService } from './documents.service';
import { Document } from './entities/document.entity';
import { AuditAction, AuditLog } from '../audit/entities/audit-log.entity';
import { Role, TypeDocument } from '../common/enums';
import { ObligationsService } from '../obligations/obligations.service';
import { Client } from '../clients/entities/client.entity';
import { Prospect } from '../prospects/entities/prospect.entity';
import { User } from '../users/entities/user.entity';

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
    utilisateur: { id: 'user-x' },
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
    softRemove: jest.fn(),
    exists: jest.fn(),
  };

  const clientRepoMock = { findOneBy: jest.fn() };
  const prospectRepoMock = { findOneBy: jest.fn() };

  const auditRepoMock = {
    save: jest.fn(),
    create: jest.fn((data) => data),
  };

  const obligationsServiceMock = {
    synchroniserPourClient: jest.fn(),
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
        { provide: getRepositoryToken(Client), useValue: clientRepoMock },
        { provide: getRepositoryToken(Prospect), useValue: prospectRepoMock },
        { provide: ObligationsService, useValue: obligationsServiceMock },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  // ------------------------------------------------------------------ upload
  describe('upload', () => {
    const file = {
      originalname: 'carte identité.PDF',
      mimetype: 'application/pdf',
      size: 20480,
      buffer: Buffer.from('pdf'),
    };

    beforeEach(() => {
      clientRepoMock.findOneBy.mockResolvedValue({
        id: 'client-1',
        ref: 'QW-2026-001',
        raisonSociale: 'Société Martin',
      });
      prospectRepoMock.findOneBy.mockResolvedValue({
        id: 'prospect-1',
        ref: 'QWP-2026-004',
        nom: 'Boulangerie Dupont',
      });
      docRepoMock.exists.mockResolvedValue(false);
      docRepoMock.save.mockImplementation((d) => Promise.resolve(d));
    });

    it('nomme le fichier Nom-Type-JJ-MM-AAAA et le range dans Clients/<Réf> <Nom>', async () => {
      const doc = await service.upload('client', 'client-1', file, COLLAB, {
        type: TypeDocument.PIECE_IDENTITE,
      });

      expect(doc.nomFichier).toMatch(
        /^SocieteMartin-PieceIdentite-\d{2}-\d{2}-\d{4}\.pdf$/,
      );
      expect(doc.cheminRelatif).toBe(
        `Clients/QW-2026-001 Société Martin/${doc.nomFichier}`,
      );
      expect(doc.nomOriginal).toBe('carte identité.PDF');
      expect(doc.client).toEqual({ id: 'client-1' });
      expect(doc.prospect).toBeNull();
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        doc.cheminStockage,
        file.buffer,
      );
      expect(
        obligationsServiceMock.synchroniserPourClient,
      ).toHaveBeenCalledWith('client-1');
    });

    it('range un document de prospect dans Prospects/ sans synchroniser les obligations client', async () => {
      const doc = await service.upload('prospect', 'prospect-1', file, COLLAB, {
        type: TypeDocument.KBIS,
      });

      expect(doc.cheminRelatif).toMatch(
        /^Prospects\/QWP-2026-004 Boulangerie Dupont\/BoulangerieDupont-Kbis-/,
      );
      expect(doc.prospect).toEqual({ id: 'prospect-1' });
      expect(doc.client).toBeNull();
      expect(
        obligationsServiceMock.synchroniserPourClient,
      ).not.toHaveBeenCalled();
    });

    it('ajoute un suffixe -2 si un document du même type existe déjà le même jour', async () => {
      docRepoMock.exists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const doc = await service.upload('client', 'client-1', file, COLLAB, {
        type: TypeDocument.KBIS,
      });

      expect(doc.nomFichier).toMatch(/-2\.pdf$/);
    });

    it("enregistre la date d'expiration et un audit CREATE", async () => {
      const doc = await service.upload('client', 'client-1', file, COLLAB, {
        type: TypeDocument.KBIS,
        dateExpiration: '2027-01-31',
      });

      expect(doc.dateExpiration).toBe('2027-01-31');
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.CREATE,
          ressource: 'Document',
          utilisateur: { id: COLLAB.id },
        }),
      );
    });

    it('rattache le document à la sous-entité fournie (ex: contact)', async () => {
      const doc = await service.upload('client', 'client-1', file, COLLAB, {
        contactId: 'contact-1',
      });

      expect(doc).toEqual(
        expect.objectContaining({
          type: TypeDocument.AUTRE,
          contact: { id: 'contact-1' },
          mission: null,
          planningEtape: null,
          operationSensible: null,
        }),
      );
    });

    it('refuse un format non autorisé', async () => {
      await expect(
        service.upload(
          'client',
          'client-1',
          { ...file, originalname: 'script.exe' },
          COLLAB,
          {},
        ),
      ).rejects.toThrow(BadRequestException);
      expect(docRepoMock.save).not.toHaveBeenCalled();
    });

    it('refuse un fichier de plus de 20 Mo', async () => {
      await expect(
        service.upload(
          'client',
          'client-1',
          { ...file, size: 21 * 1024 * 1024 },
          COLLAB,
          {},
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('lève NotFoundException si le client est introuvable', async () => {
      clientRepoMock.findOneBy.mockResolvedValue(null);

      await expect(
        service.upload('client', 'inconnu', file, COLLAB, {}),
      ).rejects.toThrow(NotFoundException);
      expect(fs.writeFileSync).not.toHaveBeenCalled();
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
        relations: [
          'utilisateur',
          'contact',
          'mission',
          'planningEtape',
          'operationSensible',
        ],
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
    it('softRemove la ligne en base, conserve le fichier et enregistre un audit DELETE', async () => {
      const doc = makeDoc();
      docRepoMock.findOne.mockResolvedValue(doc);
      docRepoMock.softRemove.mockResolvedValue(doc);

      await service.remove('doc-1', ADMIN);

      expect(fs.unlinkSync).not.toHaveBeenCalled();
      expect(docRepoMock.softRemove).toHaveBeenCalledWith(doc);
      expect(auditRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.DELETE,
          ressource: 'Document',
          ressourceId: 'doc-1',
          details: { nomFichier: doc.nomFichier },
        }),
      );
      expect(
        obligationsServiceMock.synchroniserPourClient,
      ).toHaveBeenCalledWith('client-1');
    });

    it('autorise le déposant (collaborateur) à supprimer son document', async () => {
      const doc = makeDoc({ utilisateur: { id: COLLAB.id } as User });
      docRepoMock.findOne.mockResolvedValue(doc);

      await service.remove('doc-1', COLLAB);

      expect(docRepoMock.softRemove).toHaveBeenCalledWith(doc);
    });

    it("refuse à un collaborateur de supprimer le document d'un autre", async () => {
      docRepoMock.findOne.mockResolvedValue(
        makeDoc({ utilisateur: { id: 'autre' } as User }),
      );

      await expect(service.remove('doc-1', COLLAB)).rejects.toThrow(
        ForbiddenException,
      );
      expect(docRepoMock.softRemove).not.toHaveBeenCalled();
    });

    it('lève NotFoundException si le document est introuvable', async () => {
      docRepoMock.findOne.mockResolvedValue(null);

      await expect(service.remove('inexistant', ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
