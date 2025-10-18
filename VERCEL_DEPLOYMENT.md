# 🚀 Vercel Deployment Guide - Naro App

## ⚠️ PENTING: Environment Variables yang WAJIB di Vercel

### 📋 Checklist Environment Variables

Masuk ke **Vercel Dashboard** → **Project** → **Settings** → **Environment Variables**

Tambahkan semua variable berikut:

#### 1. **Cloudinary (CRITICAL untuk upload KTP/Selfie)**
```
CLOUDINARY_CLOUD_NAME=dxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ
```

**Cara mendapatkan:**
1. Login ke https://cloudinary.com/console
2. Di Dashboard, copy ketiga value tersebut
3. **PENTING:** Paste langsung tanpa tanda kutip `" "` atau spasi

**Test di Vercel:**
- Setelah tambah ENV, klik **"Redeploy"** (bukan auto-deploy)
- Cek di Function Logs apakah muncul: `✅ Cloudinary configured`

---

#### 2. **Database**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
```

#### 3. **NextAuth**
```
NEXTAUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=https://your-app.vercel.app
```

#### 4. **Xendit (Payment)**
```
XENDIT_SECRET_KEY=xnd_development_xxxxx
XENDIT_WEBHOOK_TOKEN=your_webhook_token
```

#### 5. **App Config**
```
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## 🐛 Troubleshooting Upload Error

### Error: `Server return invalid JSON response. Status Code 500`

**Penyebab:**
- ✅ Environment variables Cloudinary belum di-set di Vercel
- ✅ Ada spasi atau tanda kutip di value ENV
- ✅ Cloud name salah ketik

**Solusi:**
1. **Verifikasi ENV di Vercel:**
   - Buka Vercel → Settings → Environment Variables
   - Pastikan ada 3 variables: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - Value harus langsung tanpa `" "` atau spasi

2. **Cek di Function Logs:**
   - Deploy ulang setelah tambah ENV
   - Buka Vercel → Deployments → Latest → Functions → Logs
   - Cari log: `🔧 Cloudinary initialization`
   - Pastikan semua `hasCloudName`, `hasApiKey`, `hasApiSecret` = `true`

3. **Test di Production:**
   - Upload KTP/Selfie
   - Jika gagal, cek logs mencari emoji `❌`
   - Error message akan memberitahu variable mana yang hilang

---

## 📝 Deployment Checklist

- [ ] Semua ENV sudah ditambahkan di Vercel
- [ ] Klik "Redeploy" setelah tambah ENV (bukan cuma push git)
- [ ] Cek Function Logs untuk konfirmasi Cloudinary configured
- [ ] Test upload KTP/Selfie di production
- [ ] Verifikasi tidak ada error 500 di logs

---

## 🔍 Debugging Commands

### Check ENV di Production:
Buka Function Logs dan cari log ini saat submit verification:
```
🔍 Environment check: {
  hasCloudName: true,
  hasApiKey: true, 
  hasApiSecret: true,
  cloudName: 'dxxxxxx'
}
```

Jika ada yang `false` → ENV belum di-set di Vercel.

---

## 📚 References

- Vercel ENV Docs: https://vercel.com/docs/environment-variables
- Cloudinary Setup: https://cloudinary.com/documentation/node_integration
- Next.js Runtime: https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes
