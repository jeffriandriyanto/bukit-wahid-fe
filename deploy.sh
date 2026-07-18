#!/bin/bash

# --- KONFIGURASI ---
SERVER_USER="bwregency"
SERVER_IP="103.67.78.150"
SERVER_PATH="~/frontend/bukit-wahid-fe"
APP_NAME="bukit-wahid-fe"
HEALTH_URL="http://localhost:3000"

echo "🚀 [1/4] Memulai Build Lokal..."

# 1. Bersihkan folder build lama dan install deps
rm -rf .output
pnpm install
export NODE_OPTIONS="--max-old-space-size=4096"
pnpm run build

# Cek apakah build berhasil
if [ $? -ne 0 ]; then
    echo "❌ Build gagal! Cek error di atas."
    exit 1
fi

echo "📦 [2/4] Kompresi & Upload..."

# 2. Kompres hasil build
tar -czvf build-output.tar.gz .output

# Upload
scp build-output.tar.gz $SERVER_USER@$SERVER_IP:$SERVER_PATH/

if [ $? -ne 0 ]; then
    echo "❌ Upload gagal! Cek koneksi SSH."
    rm build-output.tar.gz
    exit 1
fi

echo "🔧 [3/4] Eksekusi di Remote Server..."

# 3. Masuk ke server & jalankan perintah
ssh $SERVER_USER@$SERVER_IP << EOF
    cd $SERVER_PATH

    # Backup output lama untuk rollback
    if [ -d ".output" ]; then
        cp -r .output .output.backup
    fi

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

echo "🏥 [4/4] Health Check..."

# 4. Tunggu sebentar lalu cek apakah app berjalan
sleep 3
ssh $SERVER_USER@$SERVER_IP << EOF
    # Cek apakah PM2 process running
    PM2_STATUS=\$(pm2 jlist 2>/dev/null | grep -o '"status":"[^"]*"' | head -1)

    if echo "\$PM2_STATUS" | grep -q "online"; then
        echo "✅ Aplikasi berjalan normal di server."

        # Cleanup backup
        rm -rf $SERVER_PATH/.output.backup
    else
        echo "❌ Aplikasi gagal start! Melakukan rollback..."

        if [ -d "$SERVER_PATH/.output.backup" ]; then
            rm -rf $SERVER_PATH/.output
            mv $SERVER_PATH/.output.backup $SERVER_PATH/.output
            pm2 delete "$APP_NAME" || true
            pm2 start $SERVER_PATH/.output/server/index.mjs --name "$APP_NAME" --node-args="--max-old-space-size=512"
            pm2 save
            echo "⚠️  Rollback berhasil. Versi sebelumnya dipulihkan."
        else
            echo "❌ Tidak ada backup untuk rollback!"
        fi

        exit 1
    fi
EOF

# Bersihkan sisa kompresi di lokal
rm build-output.tar.gz

echo "✅ SELESAI! Aplikasi $APP_NAME sudah up-to-date di server."
