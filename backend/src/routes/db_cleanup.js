const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Delete old divisions named "Vendor" or "Vendor Catering"
    const deleted = await prisma.divisi.deleteMany({
        where: {
            nama_divisi: { in: ['Vendor', 'Vendor Catering'] },
            event_id: '1a0f81e7-dff6-42ff-bd8f-be3b3d7ed450'
        }
    });
    console.log("DELETED OLD DIVISIONS:", deleted);
}

main().catch(console.error).finally(() => prisma.$disconnect());
