import 'reflect-metadata';
import { config } from 'dotenv';
import { AppDataSource } from '../data-source';
import { seedUsers } from './seed-users';
import { seedData } from './seed-data';

config();

async function seed() {
  await AppDataSource.initialize();

  const users = await seedUsers(AppDataSource);
  await seedData(AppDataSource, users);

  console.log('\nComptes de test :');
  console.log('  admin@qwconseils.fr        / Admin1234!');
  console.log('  responsable@qwconseils.fr  / Resp1234!');
  console.log('  collab@qwconseils.fr       / Collab1234!');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Erreur seed :', err);
  process.exit(1);
});
