# Temple Accounting Frontend

Frontend application สำหรับเว็บแอปจัดการบัญชีเงินวัด

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Create `.env` file (optional, defaults to localhost:3000):
```
VITE_API_URL=http://localhost:3000/api
```

### 3. Start Development Server
```bash
npm run dev
```

Frontend will run at `http://localhost:5173`

### 4. Build for Production
```bash
npm run build
```

## Project Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Button.jsx
│   │   ├── Input.jsx
│   │   ├── Card.jsx
│   │   └── Alert.jsx
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── Layout.jsx
│   └── ProtectedRoute.jsx
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── TransactionPage.jsx
│   ├── ReportPage.jsx
│   ├── CategoryPage.jsx
│   └── SettingsPage.jsx
├── services/
│   └── api.js (Axios instance with auth)
├── store/
│   └── authStore.js (Zustand auth store)
├── App.jsx
├── main.jsx
└── index.css (Tailwind CSS)
```

## Features

- **User Authentication**: Register and login with JWT
- **Dashboard**: View income/expense summary for current month
- **Transaction Management**: Add, edit, delete transactions with category support
- **Category Management**: Create custom categories for income and expenses
- **Reports**: Generate summary and detailed accounting reports
- **Export**: Export reports to PDF and Excel (coming soon)
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Technologies

- React 18
- React Router 6
- Zustand (State Management)
- Axios (HTTP Client)
- Tailwind CSS (Styling)
- Vite (Build Tool)

## Key Components

### Button
Reusable button component with multiple variants (primary, secondary, danger, success)

### Input
Form input component with label and error support

### Card
Container component for content grouping

### Alert
Alert/notification component with different types (success, error, warning, info)

### Navbar
Top navigation bar showing user info and logout button

### Sidebar
Side menu with navigation links

### ProtectedRoute
Route wrapper that requires authentication

## Stores

### authStore
Zustand store for authentication state management
- Methods: login, register, logout, clearError
- State: user, token, isLoading, error

## Services

### api.js
Axios instance with:
- Base URL configuration
- Automatic JWT token attachment to headers
- 401 error handling (logout on token expiration)

## Pages

### LoginPage
Registration and login page

### DashboardPage
Shows income/expense summary and category breakdown for current month

### TransactionPage
CRUD operations for transactions with category filters and date selection

### ReportPage
Generate and export accounting reports in summary or detailed format

### CategoryPage
Manage income and expense categories (add, edit, delete)

### SettingsPage
User profile, password change, and notification preferences

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting service

## Environment Variables

- `VITE_API_URL`: API base URL (default: http://localhost:3000/api)

## Future Improvements

- [ ] PDF export functionality
- [ ] Excel export functionality
- [ ] Password change API integration
- [ ] Notification preferences storage
- [ ] Advanced transaction filtering
- [ ] Data visualization charts
- [ ] Budget tracking features
- [ ] Multi-user/role support
