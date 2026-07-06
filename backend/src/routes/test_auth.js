const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: '24523246@students.uii.ac.id' }
    });
    if (!user) {
        console.log('User tidak ditemukan');
        return;
    }
    console.log('User ditemukan:', user.email);
    console.log('Password Hash:', user.password_hash);
    const match = bcrypt.compareSync('password123', user.password_hash);
    console.log('Apakah match dengan "password123"?', match);
    await prisma.$disconnect();
}

main().catch(console.error);
