#!/bin/bash

# --- KONFIGURASI ---
SERVER_USER="bwregency"
SERVER_IP="103.67.78.150"
SERVER_PATH="~/frontend/bukit-wahid-fe"
APP_NAME="bukit-wahid-fe"

echo "🚀 [1/3] Memulai Build Lokal..."

# 1. Bersihkan folder build lama dan install deps
# Note: Saya tetap pakai pnpm supaya perbaikan 'hoisted' & 'IPC' tadi tidak rusak
rm -rf .output
pnpm install
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build

# Cek apakah build berhasil
if [ $? -ne 0 ]; then
    echo "❌ Build gagal! Cek error di atas."
    exit 1
fi

echo "📦 [2/3] Kompresi & Upload..."

# 2. Kompres hasil build
tar -czvf build-output.tar.gz .output

# Upload (Disini kamu bakal diminta PASSWORD pertama kali)
scp build-output.tar.gz $SERVER_USER@$SERVER_IP:$SERVER_PATH/

echo "🔧 [3/3] Eksekusi di Remote Server..."

# 3. Masuk ke server & jalankan perintah (Disini kamu bakal diminta PASSWORD kedua kali)
ssh $SERVER_USER@$SERVER_IP << EOF
    cd $SERVER_PATH

    # Hapus folder output lama
    rm -rf .output

    # Ekstrak file yang baru diupload
    tar -xzvf build-output.tar.gz

    # Hapus file archive biar hemat space
    rm build-output.tar.gz

    # Jalankan ulang PM2
    pm2 delete "$APP_NAME" || true
    pm2 start .output/server/index.mjs --name "$APP_NAME" --node-args="--max-old-space-size=512"
    pm2 save
EOF

# Bersihkan sisa kompresi di lokal
rm build-output.tar.gz

echo "✅ SELESAI! Aplikasi $APP_NAME sudah up-to-date di server."
