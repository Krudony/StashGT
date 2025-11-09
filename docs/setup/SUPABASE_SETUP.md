# Supabase Setup Guide

## การเชื่อมต่อ Supabase (Cloud Database)

ตอนนี้ Temple Accounting ใช้ **SQLite** (local file-based database) แต่สามารถเชื่อมต่อ **Supabase** (PostgreSQL cloud) ได้

---

## 📋 ขั้นตอนการตั้งค่า Supabase

### 1️⃣ สร้าง Supabase Project

- ไปที่ https://supabase.com
- สมัครสมาชิก / เข้าสู่ระบบ
- คลิก "New Project"
- ตั้งค่า:
  - **Project Name:** temple-accounting
  - **Database Password:** (บันทึกไว้ปลอดภัย)
  - **Region:** เลือก Asia (Singapore/Tokyo)
- รอให้ project สร้าง (~2 นาที)

### 2️⃣ ได้ Credentials

ไปที่ **Settings → API** และคัดลอก:
- `Project URL` → เป็น `SUPABASE_URL`
- `anon public` key → เป็น `SUPABASE_KEY`

### 3️⃣ อัปเดต .env

```bash
# temple-accounting-api/.env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
```

### 4️⃣ สร้าง Database Schema

รันใน Supabase SQL Editor:

```sql
-- Users Table
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  temple_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Transactions Table
CREATE TABLE transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('month_end', 'budget_alert')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

### 5️⃣ ทดสอบการเชื่อมต่อ

```bash
cd temple-accounting-api
npm start
```

ดู console ว่ามีข้อความ "✅ Connected to Supabase" ไหม

---

## 🔄 SQLite vs Supabase

| Feature | SQLite | Supabase |
|---------|--------|----------|
| **Setup** | ง่าย (อัตโนมัติ) | ต้องสมัครสมาชิก |
| **Database** | Local file | Cloud |
| **ราคา** | ฟรี | ฟรี/Paid |
| **Backup** | Manual | อัตโนมัติ |
| **Share** | ยาก | ง่าย |
| **Scale** | Small | Large |

---

## ✅ ตอนนี้

- ✅ สร้าง branch `feature/supabase-integration`
- ✅ ติดตั้ง `@supabase/supabase-js`
- ✅ สร้าง config file
- ⏳ รอให้คุณตั้งค่า Supabase

---

## ❓ ต้องทำไร

1. **หากใช้ SQLite:** ปล่อยไว้ (ทำงานแล้ว)
2. **หากใช้ Supabase:** ตั้งค่า credentials ตามขั้นตอนข้างต้น