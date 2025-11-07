# เว็บแอปจัดการบัญชีเงินวัด - Implementation Plan

## 📌 ภาพรวม

**โปรเจกต์:** Temple Accounting Web Application
**เอกสารออกแบบ:** `docs/design/2025-01-07-temple-accounting-design.md`
**ระยะเวลา:** ~2-3 สัปดาห์
**Priority:** High (ต้องทำเสร็จ)

---

## 🎯 ลำดับการพัฒนา (Phases)

### **Phase 1: Backend Setup & Database** (Days 1-2)
- ตั้งค่า Node.js + Hono Project
- ตั้งค่า PostgreSQL
- สร้าง Database Schema
- ตั้งค่า Authentication (JWT, bcrypt)

### **Phase 2: Backend API Development** (Days 3-7)
- Authentication API (register, login, logout)
- Transactions API (CRUD)
- Categories API (CRUD)
- Reports API (summary, export)
- Notifications API (CRUD)

### **Phase 3: Frontend Setup & Components** (Days 8-14)
- ตั้งค่า React + Tailwind CSS Project
- สร้าง Layout Components (Navbar, Sidebar)
- สร้าง Reusable Components (Button, Input, Modal, Table)
- สร้าง Page Components

### **Phase 4: Frontend Pages & Integration** (Days 15-18)
- Login & Register Page
- Dashboard Page
- Transaction Page
- Report Page
- Category & Settings Pages

### **Phase 5: Testing & Deployment** (Days 19-21)
- Integration Testing
- Bug Fixes
- Deployment (Vercel + Backend Hosting)

---

## 📋 Detailed Tasks

## Phase 1: Backend Setup & Database (Days 1-2)

### Task 1.1: ตั้งค่า Node.js + Hono Project
**Priority:** 🔴 Critical | **Estimated:** 2 hours
```bash
mkdir temple-accounting-api
cd temple-accounting-api
npm init -y
npm install hono dotenv cors

# Create folder structure
mkdir -p src/{routes,middlewares,controllers,services,models}
```

**Files to create:**
- `src/index.js` - Main entry point
- `src/config/database.js` - Database connection
- `.env` - Environment variables
- `.env.example` - Environment template

### Task 1.2: ตั้งค่า PostgreSQL Connection
**Priority:** 🔴 Critical | **Estimated:** 1 hour
```bash
npm install pg
```

**Create `src/config/database.js`:**
```javascript
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export default pool;
```

### Task 1.3: สร้าง Database Schema
**Priority:** 🔴 Critical | **Estimated:** 1 hour

**SQL Migration File: `migrations/001_init.sql`**
```sql
-- Users Table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  temple_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Transactions Table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('income', 'expense')),
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message VARCHAR(500) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('month_end', 'budget_alert')),
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
```

**Run migration:**
```bash
psql -U postgres -d temple_accounting -f migrations/001_init.sql
```

### Task 1.4: ตั้งค่า Authentication (JWT & bcrypt)
**Priority:** 🔴 Critical | **Estimated:** 1.5 hours
```bash
npm install jsonwebtoken bcryptjs
```

**Create `src/middlewares/auth.js`:**
```javascript
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

---

## Phase 2: Backend API Development (Days 3-7)

### Task 2.1: Authentication API
**Priority:** 🔴 Critical | **Estimated:** 3 hours

**Endpoints:**
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `POST /api/auth/logout` - ออกจากระบบ

**Create `src/controllers/authController.js`:**
```javascript
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const register = async (req, res) => {
  const { username, email, password, temple_name } = req.body;

  try {
    // Validate input
    if (!username || !email || !password || !temple_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (username, email, password, temple_name) VALUES ($1, $2, $3, $4) RETURNING id, username, temple_name',
      [username, email, hashedPassword, temple_name]
    );

    // Create default categories for this user
    const userId = result.rows[0].id;
    const defaultCategories = [
      { name: 'ทำบุญ', type: 'income' },
      { name: 'เบี้ยประจำวัน', type: 'income' },
      { name: 'อื่น ๆ (รายรับ)', type: 'income' },
      { name: 'ค่าใช้สอย', type: 'expense' },
      { name: 'ค่าซ่อมแซม', type: 'expense' },
      { name: 'ค่าอาหาร', type: 'expense' },
      { name: 'ค่าพระ', type: 'expense' },
      { name: 'อื่น ๆ (รายจ่าย)', type: 'expense' }
    ];

    for (const cat of defaultCategories) {
      await pool.query(
        'INSERT INTO categories (user_id, name, type, is_default) VALUES ($1, $2, $3, $4)',
        [userId, cat.name, cat.type, true]
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, username: user.username, temple_name: user.temple_name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logout = (req, res) => {
  // Token-based logout (client-side)
  res.json({ message: 'Logged out' });
};
```

**Create `src/routes/authRoutes.js`:**
```javascript
import { Hono } from 'hono';
import { register, login, logout } from '../controllers/authController.js';

const router = new Hono();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

export default router;
```

### Task 2.2: Transactions API
**Priority:** 🔴 Critical | **Estimated:** 4 hours

**Endpoints:**
- `GET /api/transactions` - ดูรายการ (with filters)
- `POST /api/transactions` - เพิ่มรายการ
- `PUT /api/transactions/:id` - แก้ไข
- `DELETE /api/transactions/:id` - ลบ

**Create `src/controllers/transactionController.js`:**
```javascript
import pool from '../config/database.js';

export const getTransactions = async (req, res) => {
  const { month, category, type } = req.query;
  const userId = req.userId;

  try {
    let query = 'SELECT t.*, c.name as category_name FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.user_id = $1';
    const params = [userId];

    if (month) {
      query += ` AND DATE_TRUNC('month', t.date) = $${params.length + 1}`;
      params.push(`${month}-01`);
    }

    if (category) {
      query += ` AND t.category_id = $${params.length + 1}`;
      params.push(category);
    }

    if (type) {
      query += ` AND t.type = $${params.length + 1}`;
      params.push(type);
    }

    query += ' ORDER BY t.date DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTransaction = async (req, res) => {
  const { type, category_id, amount, date, description, details } = req.body;
  const userId = req.userId;

  try {
    const result = await pool.query(
      'INSERT INTO transactions (user_id, category_id, type, amount, date, description, details) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [userId, category_id, type, amount, date, description, details || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { type, category_id, amount, date, description, details } = req.body;
  const userId = req.userId;

  try {
    const result = await pool.query(
      'UPDATE transactions SET type = $1, category_id = $2, amount = $3, date = $4, description = $5, details = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8 RETURNING *',
      [type, category_id, amount, date, description, details, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Task 2.3: Categories API
**Priority:** 🔴 Critical | **Estimated:** 2 hours

**Endpoints:**
- `GET /api/categories` - ดูหมวดหมู่
- `POST /api/categories` - เพิ่มหมวดหมู่
- `PUT /api/categories/:id` - แก้ไข
- `DELETE /api/categories/:id` - ลบ

(Similar structure to Transactions API)

### Task 2.4: Reports API
**Priority:** 🟡 High | **Estimated:** 3 hours

**Endpoints:**
- `GET /api/reports/summary` - สรุปรายรับ-รายจ่าย
- `GET /api/reports/export` - ส่งออก PDF/Excel

**Libraries:**
```bash
npm install pdfkit xlsx
```

### Task 2.5: Notifications API
**Priority:** 🟡 High | **Estimated:** 2 hours

**Endpoints:**
- `GET /api/notifications`
- `PUT /api/notifications/:id`

---

## Phase 3: Frontend Setup & Components (Days 8-14)

### Task 3.1: ตั้งค่า React + Tailwind CSS
**Priority:** 🔴 Critical | **Estimated:** 1.5 hours
```bash
npm create vite@latest temple-accounting-frontend -- --template react
cd temple-accounting-frontend
npm install -D tailwindcss postcss autoprefixer
npm install axios react-router-dom zustand
npx tailwindcss init -p
```

**Folder Structure:**
```
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Modal.jsx
│   │   └── Table.jsx
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── Layout.jsx
│   └── features/
│       ├── Transaction/
│       ├── Report/
│       └── Category/
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── TransactionPage.jsx
│   ├── ReportPage.jsx
│   ├── CategoryPage.jsx
│   └── SettingsPage.jsx
├── services/
│   └── api.js (Axios instance)
├── store/
│   └── authStore.js (Zustand store)
├── App.jsx
└── main.jsx
```

### Task 3.2: สร้าง Reusable Components
**Priority:** 🔴 Critical | **Estimated:** 6 hours

Components to create:
- `Button.jsx` - Reusable button with Tailwind
- `Input.jsx` - Input field
- `Modal.jsx` - Modal dialog
- `Table.jsx` - Data table
- `Card.jsx` - Card container
- `Alert.jsx` - Alert message
- `Chart.jsx` - Chart for statistics (optional)

### Task 3.3: สร้าง Layout Components
**Priority:** 🔴 Critical | **Estimated:** 2 hours

- `Navbar.jsx` - Top navigation bar
- `Sidebar.jsx` - Side menu
- `Layout.jsx` - Main layout wrapper

### Task 3.4: ตั้งค่า Routing & Store
**Priority:** 🔴 Critical | **Estimated:** 1.5 hours

**Create `src/App.jsx`:**
```jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TransactionPage from './pages/TransactionPage';
import ReportPage from './pages/ReportPage';
import CategoryPage from './pages/CategoryPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionPage />} />
          <Route path="/reports" element={<ReportPage />} />
          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
```

**Create `src/store/authStore.js` (Zustand):**
```javascript
import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: (user, token) => {
    localStorage.setItem('token', token);
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));
```

---

## Phase 4: Frontend Pages & Integration (Days 15-18)

### Task 4.1: Login & Register Page
**Priority:** 🔴 Critical | **Estimated:** 3 hours

**Create `src/pages/LoginPage.jsx`:**
- Login form
- Register form toggle
- Form validation
- API integration

### Task 4.2: Dashboard Page
**Priority:** 🔴 Critical | **Estimated:** 2 hours

**Create `src/pages/DashboardPage.jsx`:**
- Summary cards (total income, total expense, balance)
- Recent transactions table
- Monthly chart

### Task 4.3: Transaction Page
**Priority:** 🔴 Critical | **Estimated:** 3 hours

**Create `src/pages/TransactionPage.jsx`:**
- Transaction form (add/edit modal)
- Transaction list with filters
- CRUD operations

### Task 4.4: Report Page
**Priority:** 🟡 High | **Estimated:** 2 hours

**Create `src/pages/ReportPage.jsx`:**
- Month selector
- Report format selector (summary/full)
- Report preview
- Export buttons (PDF/Excel)

### Task 4.5: Category & Settings Pages
**Priority:** 🟡 High | **Estimated:** 2 hours

**Create `src/pages/CategoryPage.jsx`:**
- Category list
- Add/edit/delete category

**Create `src/pages/SettingsPage.jsx`:**
- User profile
- Notification settings
- Change password

---

## Phase 5: Testing & Deployment (Days 19-21)

### Task 5.1: Integration Testing
**Priority:** 🔴 Critical | **Estimated:** 2 hours
- Test all API endpoints
- Test Frontend-Backend integration
- Test authentication flow

### Task 5.2: Bug Fixes & Optimization
**Priority:** 🔴 Critical | **Estimated:** 2 hours
- Fix bugs found during testing
- Optimize performance
- Code cleanup

### Task 5.3: Deployment
**Priority:** 🔴 Critical | **Estimated:** 2 hours

**Frontend (Vercel):**
```bash
npm run build
# Deploy to Vercel via CLI or GitHub
```

**Backend (Choose one):**
- **Railway:** Free tier, easy setup
- **Render:** Free tier, easy deployment
- **DigitalOcean:** $5/month, more control
- **Heroku:** No longer free

---

## 📦 Dependencies Summary

### Backend
```json
{
  "hono": "^3.x",
  "pg": "^8.x",
  "dotenv": "^16.x",
  "cors": "^2.x",
  "jsonwebtoken": "^9.x",
  "bcryptjs": "^2.x",
  "pdfkit": "^0.x",
  "xlsx": "^0.x"
}
```

### Frontend
```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "zustand": "^4.x",
  "axios": "^1.x",
  "tailwindcss": "^3.x"
}
```

---

## ✅ Definition of Done (DoD)

### Phase 1: ✅
- [ ] Database schema created
- [ ] Environment variables configured
- [ ] JWT authentication setup

### Phase 2: ✅
- [ ] All API endpoints working
- [ ] Database queries tested
- [ ] Error handling implemented
- [ ] Default categories created on registration

### Phase 3: ✅
- [ ] All components created
- [ ] Tailwind CSS configured
- [ ] Routing setup
- [ ] Store (Zustand) configured

### Phase 4: ✅
- [ ] All pages created
- [ ] API integration completed
- [ ] Forms working with validation
- [ ] Export functionality working

### Phase 5: ✅
- [ ] All features tested
- [ ] No critical bugs
- [ ] Deployed to production
- [ ] Documentation updated

---

## 📊 Progress Tracking

| Phase | Task | Status | Days |
|-------|------|--------|------|
| 1 | Backend Setup | ⏳ Pending | 1-2 |
| 2 | Backend API | ⏳ Pending | 3-7 |
| 3 | Frontend Setup | ⏳ Pending | 8-14 |
| 4 | Frontend Pages | ⏳ Pending | 15-18 |
| 5 | Testing & Deploy | ⏳ Pending | 19-21 |

---

## 🚀 Next Steps

1. **Set up Backend environment** (Task 1.1)
2. **Create database and tables** (Task 1.3)
3. **Implement authentication** (Task 2.1)
4. **Build API endpoints** (Tasks 2.2-2.5)
5. **Set up Frontend project** (Task 3.1)
6. **Create components** (Tasks 3.2-3.4)
7. **Build pages** (Tasks 4.1-4.5)
8. **Test and deploy** (Phase 5)

---

**เอกสารนี้สร้างเมื่อ:** 2025-01-07
**Last Updated:** 2025-01-07
