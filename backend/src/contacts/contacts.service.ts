import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from './entities/contact.entity';
import { Client } from '../clients/entities/client.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly repo: Repository<Contact>,
  ) {}

  create(dto: CreateContactDto): Promise<Contact> {
    const c = this.repo.create({
      nom: dto.nom,
      prenom: dto.prenom ?? null,
      email: dto.email ?? null,
      telephone: dto.telephone ?? null,
      type: dto.type,
      roleDetail: dto.roleDetail ?? null,
      client: { id: dto.clientId } as Client,
    });
    return this.repo.save(c);
  }

  findByClient(clientId: string): Promise<Contact[]> {
    return this.repo.find({
      where: { client: { id: clientId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Contact> {
    const c = await this.repo.findOne({
      where: { id },
      relations: ['client'],
    });
    if (!c) throw new NotFoundException('Contact introuvable');
    return c;
  }

  async update(id: string, dto: UpdateContactDto): Promise<Contact> {
    const c = await this.repo.findOneBy({ id });
    if (!c) throw new NotFoundException('Contact introuvable');
    if (dto.nom !== undefined) c.nom = dto.nom;
    if (dto.prenom !== undefined) c.prenom = dto.prenom ?? null;
    if (dto.email !== undefined) c.email = dto.email ?? null;
    if (dto.telephone !== undefined) c.telephone = dto.telephone ?? null;
    if (dto.type !== undefined) c.type = dto.type;
    if (dto.roleDetail !== undefined) c.roleDetail = dto.roleDetail ?? null;
    return this.repo.save(c);
  }

  async remove(id: string): Promise<void> {
    const c = await this.repo.findOneBy({ id });
    if (!c) throw new NotFoundException('Contact introuvable');
    await this.repo.remove(c);
  }
}
