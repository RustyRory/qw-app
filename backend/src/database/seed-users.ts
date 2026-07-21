import 'reflect-metadata';
import { config } from 'dotenv';
import { hash } from 'bcrypt';
import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums';

config();

export interface SeededUsers {
  admin: User;
  responsable: User;
  collaborateur: User;
}

export async function seedUsers(dataSource: DataSource): Promise<SeededUsers> {
  const userRepo = dataSource.getRepository(User);

  const existingAdmin = await userRepo.findOneBy({
    email: 'admin@qwconseils.fr',
  });
  if (existingAdmin) {
    console.log('✓ Utilisateurs déjà seedés, réutilisation.');
    const [admin, responsable, collaborateur] = await Promise.all([
      userRepo.findOneByOrFail({ email: 'admin@qwconseils.fr' }),
      userRepo.findOneByOrFail({ email: 'responsable@qwconseils.fr' }),
      userRepo.findOneByOrFail({ email: 'collab@qwconseils.fr' }),
    ]);
    return { admin, responsable, collaborateur };
  }

  const admin = userRepo.create({
    email: 'admin@qwconseils.fr',
    passwordHash: await hash('Admin1234!', 12),
    role: Role.ADMIN,
    prenom: 'Alice',
    nom: 'Martin',
    isActive: true,
  });

  const responsable = userRepo.create({
    email: 'responsable@qwconseils.fr',
    passwordHash: await hash('Resp1234!', 12),
    role: Role.RESPONSABLE,
    prenom: 'Claire',
    nom: 'Leroy',
    isActive: true,
  });

  const collaborateur = userRepo.create({
    email: 'collab@qwconseils.fr',
    passwordHash: await hash('Collab1234!', 12),
    role: Role.COLLABORATEUR,
    prenom: 'Bob',
    nom: 'Dupont',
    isActive: true,
  });

  await userRepo.save([admin, responsable, collaborateur]);
  console.log('✓ Utilisateurs créés');

  return { admin, responsable, collaborateur };
}

async function run() {
  await AppDataSource.initialize();
  await seedUsers(AppDataSource);

  console.log('\nComptes de test :');
  console.log('  admin@qwconseils.fr        / Admin1234!');
  console.log('  responsable@qwconseils.fr  / Resp1234!');
  console.log('  collab@qwconseils.fr       / Collab1234!');

  await AppDataSource.destroy();
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Erreur seed:users :', err);
    process.exit(1);
  });
}
