# แก้ไขปัญหาการเข้าสู่ระบบ (Login Troubleshooting)

## ปัญหาที่พบบ่อย

### 1. เข้าระบบไม่ได้ - Invalid login credentials
**สาเหตุ:** อีเมลหรือรหัสผ่านไม่ถูกต้อง

**วิธีแก้ไข:**
- ตรวจสอบอีเมลและรหัสผ่านอีกครั้ง
- ลองใช้ฟังก์ชัน "ลงทะเบียนผู้ใช้งานใหม่" เพื่อสร้างบัญชีใหม่
- หรือรีเซ็ตรหัสผ่านผ่าน Supabase Dashboard

---

### 2. เข้าระบบไม่ได้ - Email not confirmed
**สาเหตุ:** Supabase ตั้งค่าให้ต้องยืนยันอีเมลก่อนเข้าสู่ระบบ

**วิธีแก้ไข:**

#### วิธีที่ 1: ปิด Email Confirmation (แนะนำสำหรับการพัฒนา)
1. ไปที่ Supabase Dashboard
2. เลือก Project ของคุณ
3. ไปที่ **Authentication** > **Settings**
4. หา **"Enable email confirmations"**
5. **ปิด** การยืนยันอีเมล (Disable)
6. บันทึกการตั้งค่า
7. ลองเข้าสู่ระบบอีกครั้ง

#### วิธีที่ 2: ยืนยันอีเมล
1. ตรวจสอบกล่องจดหมาย (และโฟลเดอร์ Spam)
2. คลิกลิงก์ยืนยันในอีเมล
3. ลองเข้าสู่ระบบอีกครั้ง

---

### 3. เข้าระบบไม่ได้ - Failed to fetch / Network error
**สาเหตุ:** ไม่สามารถเชื่อมต่อกับ Supabase ได้

**วิธีแก้ไข:**
1. ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
2. ตรวจสอบ Supabase URL และ API Key:
   - ไปที่หน้า Settings ในแอป
   - ตรวจสอบว่า URL และ Key ถูกต้อง
   - หรือกดปุ่ม "รีเซ็ตการเชื่อมต่อ" และตั้งค่าใหม่
3. ตรวจสอบว่า Supabase Project ยังใช้งานได้:
   - ไปที่ Supabase Dashboard
   - ตรวจสอบสถานะ Project

---

### 4. เข้าระบบได้แต่ไม่สามารถใช้งานได้
**สาเหตุ:** ยังไม่ได้ตั้งค่า Admin role

**วิธีแก้ไข:**
1. ไปที่ Supabase Dashboard > SQL Editor
2. รันคำสั่งนี้ (แทนที่ YOUR_USER_ID ด้วย User ID ของคุณ):
```sql
INSERT INTO user_roles (user_id, role)
VALUES ('YOUR_USER_ID', 'admin');
```

หรือตั้งค่า user แรกเป็น admin อัตโนมัติ:
```sql
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM user_roles)
LIMIT 1;
```

---

### 5. สมัครสมาชิกแล้วแต่เข้าสู่ระบบไม่ได้
**สาเหตุ:** Email confirmation ถูกเปิดอยู่

**วิธีแก้ไข:**
- ปิด Email Confirmation ใน Supabase Dashboard (ตามวิธีที่ 1 ในข้อ 2)
- หรือรออีเมลยืนยันและคลิกลิงก์

---

## วิธีตรวจสอบปัญหา

### ตรวจสอบ Console
1. เปิด Developer Tools (F12)
2. ไปที่แท็บ Console
3. ดู error messages
4. แจ้ง error ที่เห็นเพื่อขอความช่วยเหลือ

### ตรวจสอบ Supabase Dashboard
1. ไปที่ **Authentication** > **Users**
2. ตรวจสอบว่ามี user อยู่หรือไม่
3. ตรวจสอบสถานะ user (confirmed/unconfirmed)

### ตรวจสอบ Network
1. เปิด Developer Tools (F12)
2. ไปที่แท็บ Network
3. ลองเข้าสู่ระบบ
4. ดูว่ามี request ไปยัง Supabase หรือไม่
5. ตรวจสอบ response status

---

## การตั้งค่า Supabase ที่แนะนำ

### สำหรับการพัฒนา (Development)
- **Email Confirmation:** ปิด (Disabled)
- **Enable Sign Up:** เปิด (Enabled)
- **Enable Email Sign In:** เปิด (Enabled)

### สำหรับการใช้งานจริง (Production)
- **Email Confirmation:** เปิด (Enabled) - เพื่อความปลอดภัย
- **Enable Sign Up:** ปิด (Disabled) - ให้ admin สร้าง user เอง
- **Enable Email Sign In:** เปิด (Enabled)

---

## ติดต่อขอความช่วยเหลือ

หากยังแก้ไขไม่ได้:
1. ตรวจสอบ Console errors
2. ตรวจสอบ Network requests
3. ตรวจสอบ Supabase Dashboard logs
4. แจ้งปัญหาพร้อม error messages ที่เห็น

