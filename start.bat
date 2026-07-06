@echo off
echo =========================================
echo       Memulai EventCrew...
echo =========================================

echo 1. Memulai Server Backend...
start cmd /k "cd backend && npm run dev"

echo 2. Memulai Server Frontend...
start cmd /k "cd frontend && npm run dev"

echo Selesai! Dua terminal baru telah terbuka.
echo Silakan tunggu beberapa detik hingga Vite memberikan URL localhost Anda.
echo =========================================
