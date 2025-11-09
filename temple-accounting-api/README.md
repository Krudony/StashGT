# Temple Accounting API

Backend API สำหรับเว็บแอปจัดการบัญชีเงินวัด

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
```bash
# Create PostgreSQL database
createdb temple_accounting

# Run migrations
psql -U postgres -d temple_accounting -f migrations/001_init.sql
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database URL and JWT secret
```

### 4. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Transactions
- `GET /api/transactions` - Get all transactions (with filters)
  - Query: `?month=2025-01&category=1&type=income`
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Reports
- `GET /api/reports/summary?month=2025-01` - Get summary report
- `GET /api/reports/detailed?month=2025-01` - Get detailed report
- `GET /api/reports/export-pdf?month=2025-01&format=summary` - Export as PDF
- `GET /api/reports/export-excel?month=2025-01&format=summary` - Export as Excel

### Notifications
- `GET /api/notifications` - Get all notifications
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read
- `DELETE /api/notifications/:id` - Delete notification

## Authentication

All endpoints (except `/api/auth/*`) require JWT token in header:
```
Authorization: Bearer <token>
```

## Project Structure

```
src/
├── index.js              - Main entry point
├── config/
│   └── database.js       - Database connection
├── middlewares/
│   └── auth.js          - JWT verification middleware
├── controllers/
│   ├── authController.js
│   ├── transactionController.js
│   ├── categoryController.js
│   ├── reportController.js
│   └── notificationController.js
└── routes/
    ├── authRoutes.js
    ├── transactionRoutes.js
    ├── categoryRoutes.js
    ├── reportRoutes.js
    └── notificationRoutes.js
```

## Environment Variables

```
DATABASE_URL=postgresql://user:password@localhost:5432/temple_accounting
JWT_SECRET=your_super_secret_key
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

## Features

- User authentication with JWT
- Manage income and expense transactions
- Category management with default categories
- Generate accounting reports (summary and detailed)
- Export to PDF and Excel
- Notification system
- Full data security with user isolation

## Next Steps

- [ ] Implement PDF export functionality
- [ ] Implement Excel export functionality
- [ ] Add notification scheduling
- [ ] Add budget alert functionality
- [ ] Add transaction search and advanced filtering
- [ ] Add API rate limiting
- [ ] Add request validation middleware
- [ ] Add comprehensive error handling
