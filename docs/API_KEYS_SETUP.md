# การตั้งค่า API Keys

## ⚠️ คำเตือนด้านความปลอดภัย

### Supabase Keys

Supabase มี 2 ประเภทของ API Keys:

1. **Anon Key (Public Key)** - ใช้ใน Frontend
   - ปลอดภัยสำหรับใช้ใน client-side
   - ถูกควบคุมโดย Row Level Security (RLS)
   - ควรใช้ key นี้ในแอปพลิเคชัน

2. **Service Role Key (Secret Key)** - ใช้ใน Backend เท่านั้น
   - ⚠️ **ห้ามใช้ใน Frontend**
   - Bypass RLS ทั้งหมด
   - มีสิทธิ์เต็มในการเข้าถึงฐานข้อมูล
   - ควรใช้ใน server-side functions เท่านั้น

## วิธีตั้งค่า

### 1. สร้างไฟล์ `.env.local`

```bash
# คัดลอกจาก .env.example
cp .env.example .env.local
```

### 2. ใส่ค่าใน `.env.local`

```env
SUPABASE_URL=https://gbltkenplrbrraufyyvg.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. หา API Keys ใน Supabase Dashboard

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. เลือก Project ของคุณ
3. ไปที่ **Settings** > **API**
4. คัดลอก:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY` (ใช้ใน frontend)
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (ใช้ใน backend เท่านั้น)

## ⚠️ สิ่งที่ห้ามทำ

1. ❌ **ห้าม commit `.env.local` ลง git**
2. ❌ **ห้ามใช้ Service Role Key ใน frontend**
3. ❌ **ห้ามแชร์ API keys ใน public**
4. ❌ **ห้าม hardcode keys ในโค้ด**

## ✅ สิ่งที่ควรทำ

1. ✅ ใช้ Anon Key ใน frontend
2. ✅ เก็บ Service Role Key ใน server-side เท่านั้น
3. ✅ ใช้ environment variables
4. ✅ เพิ่ม `.env.local` ใน `.gitignore`
5. ✅ ใช้ `.env.example` เป็น template

## การใช้งานในโค้ด

### Frontend (ใช้ Anon Key)

```typescript
// lib/supabaseClient.ts
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // ✅ ใช้ anon key
```

### Backend/Server (ใช้ Service Role Key)

```typescript
// server-side only
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ ใช้ service role key
);
```

## ตรวจสอบว่า Keys ถูกต้อง

### Anon Key
- ขึ้นต้นด้วย `eyJ...`
- ใช้ได้ใน frontend
- ถูกควบคุมโดย RLS

### Service Role Key
- ขึ้นต้นด้วย `sb_secret_...` หรือ `eyJ...`
- ใช้ได้ใน backend เท่านั้น
- Bypass RLS ทั้งหมด

## หาก Keys ถูกขโมย

1. ไปที่ Supabase Dashboard
2. Settings > API
3. คลิก "Reset" ด้านข้าง key ที่ถูกขโมย
4. อัปเดต key ใหม่ใน `.env.local`
5. Deploy ใหม่

---

## Gemini API - Quota Issues

### ปัญหา: "You exceeded your current quota"

ข้อความนี้หมายความว่าคุณใช้อักษร AI ไปเกินโควต้าฟรี

**Free Tier Limits:**
- 50 requests per day
- 2 requests per minute
- 32,000 input tokens per minute

### วิธีแก้:

1. **รอ 24 ชั่วโมง** - Quota reset ที่ UTC midnight
2. **ใช้ Upload รูปเอง** - ไม่ใช้ AI generation
3. **Upgrade to Paid Plan** - ได้ 1,000+ requests/day

### วิธี Upgrade:

1. ไปที่ [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API key"
3. ไปที่ [Google Cloud Console Billing](https://console.cloud.google.com/billing)
4. Add Payment Method
5. API key จะทำงานได้เลยกับ higher limits

### ประหยัดโควต้า:

- ✅ Upload รูปสำหรับ services ส่วนใหญ่
- ✅ สร้าง AI images แค่เมื่อจำเป็น
- ✅ ไม่ต้องสร้างซ้ำ
- ✅ ตรวจ usage ที่ [Google Cloud Console](https://console.cloud.google.com/iam-admin/quotas)

### ตรวจสอบ Usage:

```
ไปที่ Google Cloud Console
> IAM & Admin > Quotas
> Filter: generativelanguage.googleapis.com
> ดู Current Usage
```

โปรดดู `docs/TROUBLESHOOTING_GEMINI.md` สำหรับรายละเอียดเพิ่มเติม

