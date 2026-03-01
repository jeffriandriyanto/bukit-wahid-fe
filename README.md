# 1. Bersihkan folder build lama dan install deps
rm -rf .output
npm install
export NODE_OPTIONS="--max-old-space-size=4096" 
npm run build

# 2. Kompres hasil build menjadi satu file archive
# Kita gunakan tar agar symlink tetap terjaga dan ukuran upload lebih kecil
tar -czvf build-output.tar.gz .output
scp build-output.tar.gz bwregency@103.67.78.150:~/frontend/bukit-wahid-fe/

# 1. Masuk ke folder project
ssh bwregency@103.67.78.150
cd ~/frontend/bukit-wahid-fe/

# 2. Hapus folder output lama agar tidak konflik
rm -rf .output

# 3. Ekstrak file yang baru diupload
tar -xzvf build-output.tar.gz

# 4. Hapus file archive (opsional, untuk hemat disk space)
rm build-output.tar.gz

# 5. Jalankan aplikasi menggunakan PM2 (Agar tetap jalan di background)
# Jika belum ada PM2: npm install -g pm2
pm2 delete "bukit-wahid-fe" || true
pm2 start .output/server/index.mjs --name "bukit-wahid-fe" --node-args="--max-old-space-size=512"

kmzwa8awaa
13ukitWahid

<div
      class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4"
    >
      <div
        class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div class="w-full md:w-80">
          <UFormField>
            <UInput
              v-model="search"
              icon="i-lucide-search"
              placeholder="Cari NIK atau Nama..."
              size="md"
              block
            />
          </UFormField>
        </div>

        <div class="flex gap-2">
          <!-- <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-download"
            label="Export"
          /> -->
          <UButton
            color="primary"
            icon="i-lucide-plus-circle"
            label="Tambah Warga"
            @click="openAddModal"
          />
        </div>
      </div>
    </div>
