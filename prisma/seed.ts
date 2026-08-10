import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding LumaGen database...');

  await prisma.generatedAsset.create({
    data: {
      prompt: 'Futuristic cyberpunk neon city in 8K resolution',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
      width: 1024,
      height: 1024,
    },
  });

  console.log('Seeding complete for LumaGen.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
