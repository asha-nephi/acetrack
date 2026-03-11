import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding AceTrack with admin user only...');

    // Only create a hashed admin user — all other data is entered via the app UI
    const hashedPassword = await bcrypt.hash('Admin@2026', 10);

    await prisma.user.upsert({
        where: { email: 'admin@acefacades.com' },
        update: {},
        create: {
            email: 'admin@acefacades.com',
            password: hashedPassword,
            name: 'AceTrack Admin',
            role: 'admin',
        },
    });

    console.log('✅ Seed complete. Login with admin@acefacades.com / Admin@2026');
    console.log('ℹ️  All other data (projects, tasks, documents, etc.) is entered via the app UI.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
