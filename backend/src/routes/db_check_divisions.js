const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const divisions = await prisma.divisi.findMany({
        where: { event_id: '1a0f81e7-dff6-42ff-bd8f-be3b3d7ed450' },
        select: {
            divisi_id: true,
            nama_divisi: true
        }
    });
    console.log("DIVISIONS FOR EVENT:", JSON.stringify(divisions, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
