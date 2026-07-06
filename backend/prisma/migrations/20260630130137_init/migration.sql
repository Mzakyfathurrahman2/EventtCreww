-- CreateTable
CREATE TABLE "organisasi" (
    "organisasi_id" TEXT NOT NULL PRIMARY KEY,
    "nama_organisasi" TEXT NOT NULL,
    "jenis_organisasi" TEXT NOT NULL,
    "kampus" TEXT NOT NULL,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'AKTIF'
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL PRIMARY KEY,
    "nama_lengkap" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "organisasi_id" TEXT,
    "role_default" TEXT NOT NULL DEFAULT 'ANGGOTA',
    "tanggal_daftar" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_akun" TEXT NOT NULL DEFAULT 'AKTIF',
    "terakhir_login" DATETIME,
    "reset_token" TEXT,
    "reset_token_expired" DATETIME,
    CONSTRAINT "users_organisasi_id_fkey" FOREIGN KEY ("organisasi_id") REFERENCES "organisasi" ("organisasi_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "events" (
    "event_id" TEXT NOT NULL PRIMARY KEY,
    "nama_event" TEXT NOT NULL,
    "tanggal_pelaksanaan" DATETIME NOT NULL,
    "jenis_event" TEXT NOT NULL,
    "status_event" TEXT NOT NULL DEFAULT 'PERSIAPAN',
    "organisasi_id" TEXT NOT NULL,
    "dibuat_oleh" TEXT NOT NULL,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invite_token" TEXT,
    "invite_token_expired" DATETIME,
    CONSTRAINT "events_organisasi_id_fkey" FOREIGN KEY ("organisasi_id") REFERENCES "organisasi" ("organisasi_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "events_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tasks" (
    "task_id" TEXT NOT NULL PRIMARY KEY,
    "judul_tugas" TEXT NOT NULL,
    "deskripsi" TEXT,
    "deadline" DATETIME NOT NULL,
    "prioritas" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status_tugas" TEXT NOT NULL DEFAULT 'TODO',
    "event_id" TEXT NOT NULL,
    "divisi_id" TEXT,
    "assignee_id" TEXT,
    "dibuat_oleh" TEXT NOT NULL,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tasks_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tasks_divisi_id_fkey" FOREIGN KEY ("divisi_id") REFERENCES "divisi" ("divisi_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tasks_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sub_tasks" (
    "subtask_id" TEXT NOT NULL PRIMARY KEY,
    "judul_subtask" TEXT NOT NULL,
    "deskripsi" TEXT,
    "deadline" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "task_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "dibuat_oleh" TEXT NOT NULL,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sub_tasks_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "tasks" ("task_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sub_tasks_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "sub_tasks_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "divisi" (
    "divisi_id" TEXT NOT NULL PRIMARY KEY,
    "nama_divisi" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "koordinator_id" TEXT,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "divisi_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "divisi_koordinator_id_fkey" FOREIGN KEY ("koordinator_id") REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "absensi" (
    "absensi_id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "sesi_id" TEXT NOT NULL,
    "waktu_scan" DATETIME,
    "status_hadir" TEXT NOT NULL DEFAULT 'TIDAK_HADIR',
    CONSTRAINT "absensi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "absensi_sesi_id_fkey" FOREIGN KEY ("sesi_id") REFERENCES "sesi_absensi" ("sesi_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sesi_absensi" (
    "sesi_id" TEXT NOT NULL PRIMARY KEY,
    "nama_sesi" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "jenis_sesi" TEXT NOT NULL,
    "waktu_mulai" DATETIME NOT NULL,
    "waktu_selesai" DATETIME NOT NULL,
    "status_sesi" TEXT NOT NULL DEFAULT 'AKTIF',
    "qr_token" TEXT NOT NULL,
    "dibuat_oleh" TEXT NOT NULL,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sesi_absensi_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "sesi_absensi_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pengumuman" (
    "pengumuman_id" TEXT NOT NULL PRIMARY KEY,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "divisi_id" TEXT,
    "dibuat_oleh" TEXT NOT NULL,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pengumuman_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pengumuman_divisi_id_fkey" FOREIGN KEY ("divisi_id") REFERENCES "divisi" ("divisi_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "pengumuman_dibuat_oleh_fkey" FOREIGN KEY ("dibuat_oleh") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "keanggotaan_event" (
    "keanggotaan_id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "divisi_id" TEXT,
    "role_event" TEXT NOT NULL DEFAULT 'ANGGOTA',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "bergabung_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disetujui_oleh" TEXT,
    CONSTRAINT "keanggotaan_event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "keanggotaan_event_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "keanggotaan_event_divisi_id_fkey" FOREIGN KEY ("divisi_id") REFERENCES "divisi" ("divisi_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "keanggotaan_event_disetujui_oleh_fkey" FOREIGN KEY ("disetujui_oleh") REFERENCES "users" ("user_id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifikasi" (
    "notif_id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "link_ref" TEXT,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifikasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "notifikasi_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "pesan_chat" (
    "pesan_id" TEXT NOT NULL PRIMARY KEY,
    "divisi_id" TEXT NOT NULL,
    "pengirim_id" TEXT NOT NULL,
    "isi_pesan" TEXT NOT NULL,
    "dikirim_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "pesan_chat_divisi_id_fkey" FOREIGN KEY ("divisi_id") REFERENCES "divisi" ("divisi_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "pesan_chat_pengirim_id_fkey" FOREIGN KEY ("pengirim_id") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dokumen" (
    "dokumen_id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "divisi_id" TEXT,
    "kategori" TEXT NOT NULL DEFAULT 'UMUM',
    "nama_file" TEXT NOT NULL,
    "ukuran_byte" INTEGER NOT NULL,
    "tipe_file" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "diupload_oleh" TEXT NOT NULL,
    "diupload_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "dokumen_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "dokumen_divisi_id_fkey" FOREIGN KEY ("divisi_id") REFERENCES "divisi" ("divisi_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "dokumen_diupload_oleh_fkey" FOREIGN KEY ("diupload_oleh") REFERENCES "users" ("user_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "laporan_event" (
    "laporan_id" TEXT NOT NULL PRIMARY KEY,
    "event_id" TEXT NOT NULL,
    "total_tugas" INTEGER NOT NULL DEFAULT 0,
    "tugas_selesai" INTEGER NOT NULL DEFAULT 0,
    "tugas_terlambat" INTEGER NOT NULL DEFAULT 0,
    "tugas_tidak_selesai" INTEGER NOT NULL DEFAULT 0,
    "persen_selesai" REAL NOT NULL DEFAULT 0,
    "data_per_divisi" TEXT NOT NULL DEFAULT '[]',
    "data_kehadiran" TEXT NOT NULL DEFAULT '[]',
    "ranking_divisi_terbaik" TEXT,
    "dibuat_pada" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "laporan_event_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events" ("event_id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "divisi_nama_divisi_event_id_key" ON "divisi"("nama_divisi", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "absensi_user_id_sesi_id_key" ON "absensi"("user_id", "sesi_id");

-- CreateIndex
CREATE UNIQUE INDEX "sesi_absensi_qr_token_key" ON "sesi_absensi"("qr_token");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_event_event_id_key" ON "laporan_event"("event_id");
