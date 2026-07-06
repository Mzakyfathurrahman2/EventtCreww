const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("=== Users ===");
    const users = await prisma.user.findMany();
    console.log(users.map(u => ({
        user_id: u.user_id,
        nama_lengkap: u.nama_lengkap,
        email: u.email,
        organisasi_id: u.organisasi_id,
        role_default: u.role_default
    })));

    console.log("\n=== Keanggotaan Event ===");
    const keanggotaan = await prisma.keanggotaanEvent.findMany({
        include: {
            user: { select: { nama_lengkap: true, email: true } },
            event: { select: { nama_event: true, organisasi_id: true } }
        }
    });
    console.log(keanggotaan.map(k => ({
        keanggotaan_id: k.keanggotaan_id,
        nama: k.user.nama_lengkap,
        email: k.user.email,
        nama_event: k.event.nama_event,
        event_id: k.event_id,
        role_event: k.role_event,
        status: k.status
    })));

    console.log("\n=== Events ===");
    const events = await prisma.event.findMany();
    console.log(events.map(e => ({
        event_id: e.event_id,
        nama_event: e.nama_event,
        organisasi_id: e.organisasi_id
    })));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
