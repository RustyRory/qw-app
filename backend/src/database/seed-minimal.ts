import 'reflect-metadata';
import { config } from 'dotenv';
import { hash } from 'bcrypt';
import { AppDataSource } from '../data-source';
import { User } from '../users/entities/user.entity';
import { Role } from '../common/enums';

config();

async function seed() {
  await AppDataSource.initialize();
  const userRepo = AppDataSource.getRepository(User);

  const admin = userRepo.create({
    email: 'admin@qwconseils.fr',
    passwordHash: await hash('Admin1234!', 12),
    role: Role.ADMIN,
    prenom: 'Admin',
    nom: '',
    isActive: true,
  });

  const moderateur = userRepo.create({
    email: 'moderateur@qwconseils.fr',
    passwordHash: await hash('Moderateur1234!', 12),
    role: Role.MODERATEUR,
    prenom: 'Modérateur',
    nom: '',
    isActive: true,
  });

  await userRepo.save([admin, moderateur]);
  console.log('✓ Comptes créés');

  console.log('\nComptes de test :');
  console.log('  admin@qwconseils.fr        / Admin1234!');
  console.log('  moderateur@qwconseils.fr   / Moderateur1234!');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Erreur seed:minimal :', err);
  process.exit(1);
});
