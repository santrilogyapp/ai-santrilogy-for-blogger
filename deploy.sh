#!/bin/bash
# Deployment script untuk Santrilogy AI Worker

echo "==========================================="
echo "Santrilogy AI Worker Deployment Script"
echo "==========================================="

# Cek apakah wrangler terinstal
if ! command -v wrangler &> /dev/null; then
    echo "Wrangler CLI tidak ditemukan. Silakan instal dengan:"
    echo "npm install -g wrangler"
    exit 1
fi

echo "✓ Wrangler CLI ditemukan"

# Cek apakah sudah login
if ! wrangler config &> /dev/null; then
    echo "Silakan login ke Cloudflare:"
    echo "wrangler login"
    exit 1
fi

echo "✓ Sudah login ke Cloudflare"

# Backup wrangler.toml sementara
if [ -f "wrangler.toml" ]; then
    cp wrangler.toml wrangler.toml.backup
    echo "✓ Backup wrangler.toml dibuat"
fi

# Buat wrangler.toml dengan konfigurasi yang benar
cat > wrangler.toml << 'EOL'
name = "worker-santrilogy-ai"
main = "worker/index-enhanced.js"
compatibility_date = "2023-12-01"

[env.production]
account_id = "YOUR_ACCOUNT_ID_HERE"  # Ganti dengan account ID Anda
workers_dev = false
route = { pattern = "santrilogy-ai.santrilogyapp.workers.dev", zone_id = "" }
EOL

echo "✓ File wrangler.toml telah dibuat"

# Ganti YOUR_ACCOUNT_ID_HERE dengan account ID sebenarnya
echo "Silakan masukkan Cloudflare Account ID Anda:"
read -p "Account ID: " account_id

if [ ! -z "$account_id" ]; then
    sed -i "s/YOUR_ACCOUNT_ID_HERE/$account_id/" wrangler.toml
    echo "✓ Account ID telah diisi"
else
    echo "Peringatan: Account ID tidak diisi. Anda perlu mengedit wrangler.toml secara manual."
fi

# Deploy worker
echo "Memulai deployment..."
if wrangler deploy; then
    echo "✓ Worker berhasil dideploy"
    echo ""
    echo "==========================================="
    echo "Langkah selanjutnya:"
    echo "1. Pastikan semua environment variables telah di-set:"
    echo "   wrangler secret put FIREBASE_PROJECT_ID"
    echo "   wrangler secret put FIREBASE_CLIENT_EMAIL" 
    echo "   wrangler secret put FIREBASE_PRIVATE_KEY"
    echo "   wrangler secret put FIREBASE_API_KEY"
    echo "   wrangler secret put GOOGLE_CLIENT_ID"
    echo "   wrangler secret put GOOGLE_CLIENT_SECRET"
    echo "   wrangler secret put ALLOWED_ORIGINS"
    echo ""
    echo "2. Buka aplikasi di browser untuk mengecek autentikasi"
    echo "==========================================="
else
    echo "✗ Deployment gagal"
    # Kembalikan backup jika ada error
    if [ -f "wrangler.toml.backup" ]; then
        mv wrangler.toml.backup wrangler.toml
        echo "✗ Backup wrangler.toml dikembalikan"
    fi
    exit 1
fi

# Kembalikan wrangler.toml asli jika deployment berhasil
if [ -f "wrangler.toml.backup" ]; then
    rm wrangler.toml.backup
    echo "✓ Backup wrangler.toml dihapus"
fi

echo ""
echo "Deployment selesai! Silakan periksa aplikasi Anda."