# Story 002: Complete Transaction Management (CRUD)

**Epic:** Core Features - Transaction Management
**Priority:** 🔥 Priority 1 - Critical
**Status:** TODO
**Assigned to:** Full Stack Team
**Sprint:** Phase 4, Week 1 (Nov 7-13)

---

## 📋 User Story

As a **Temple Accountant**, I want to **perform complete Create, Read, Update, and Delete operations on transactions**, so that **I can maintain accurate financial records and correct any data entry errors**.

---

## 🎯 Acceptance Criteria

### Must Have ✅
- [ ] Create new transactions with all required fields
- [ ] View/Search transactions with filtering capabilities
- [ ] Edit existing transactions with audit trail
- [ ] Delete transactions with confirmation dialog
- [ ] Input validation on all transaction fields
- [ ] Real-time balance updates after transaction changes
- [ ] Transaction data persists correctly in database
- [ ] Support both income and expense transactions
- [ ] Category auto-complete/selection on creation

### Should Have 🟡
- [ ] Bulk operations (multiple delete, bulk import)
- [ ] Transaction history/changelog viewing
- [ ] Duplicate detection warnings
- [ ] Recurring transaction templates
- [ ] Transaction notes/attachments support
- [ ] Undo/Redo functionality

### Nice to Have 🟢
- [ ] Receipt photo attachment
- [ ] OCR for receipt scanning
- [ ] Transaction suggestions based on patterns
- [ ] Voice input for transactions

---

## 🔧 Technical Specifications

### Database Schema
```sql
-- Existing transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'income' or 'expense'
  amount DECIMAL(12, 2) NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  transaction_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL
);

-- Add indexes for performance
CREATE INDEX idx_transactions_user_date
ON transactions(user_id, transaction_date DESC);

CREATE INDEX idx_transactions_category
ON transactions(user_id, category_id);

CREATE INDEX idx_transactions_type
ON transactions(user_id, transaction_type);
```

### API Endpoints

```
POST /api/transactions
- Create new transaction
- Body: { amount, type, description, category_id, transaction_date }
- Response: { id, ...transaction_data }
- Status: 201 Created

GET /api/transactions
- List user's transactions with pagination
- Query: ?limit=20&offset=0&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&category=id&type=income
- Response: { total, data: [...], pagination: {} }
- Status: 200 OK

GET /api/transactions/:id
- Get single transaction details
- Response: { ...transaction_data }
- Status: 200 OK

PUT /api/transactions/:id
- Update existing transaction
- Body: { amount, type, description, category_id, transaction_date }
- Response: { ...updated_transaction }
- Status: 200 OK

DELETE /api/transactions/:id
- Soft delete transaction (set deleted_at)
- Response: { success: true, message: "Transaction deleted" }
- Status: 200 OK
```

### Frontend Components
**Files:**
- `temple-accounting-frontend/src/pages/TransactionPage.jsx`
- `temple-accounting-frontend/src/components/Transaction/*`

Components needed:
1. **TransactionList** - Table view of transactions with sorting
2. **TransactionForm** - Create/Edit form modal
3. **TransactionFilter** - Filter by date, category, type, amount
4. **TransactionDetail** - Detail view for single transaction
5. **TransactionBulkActions** - Bulk operations toolbar

---

## 📊 Validation Rules

### Amount Field
- Required, must be positive number
- Max 999,999.99
- At least 2 decimal places
- No special characters

### Description Field
- Optional, max 500 characters
- Prevent SQL injection
- Trim whitespace

### Category Field
- Required
- Must exist in user's categories
- Auto-populate with user's default category

### Date Field
- Required
- Must be valid date
- Cannot be future date (optional: configurable)
- Support date range 1 January 2020 - 31 December 2030

### Type Field
- Required
- Must be either "income" or "expense"
- Case-insensitive validation

---

## 🧪 Test Scenarios

### Test Case 1: Create Transaction
- **Setup:** Login, navigate to transaction form
- **Steps:**
  1. Fill amount: 1500
  2. Select type: income
  3. Enter description: "Sunday donation"
  4. Select category: "บริจาค"
  5. Set date: 2025-11-09
  6. Click Save
- **Expected:** Transaction appears in list, balance updates
- **Validation:** Database record created correctly

### Test Case 2: Update Transaction
- **Setup:** Select existing transaction
- **Steps:**
  1. Click Edit
  2. Change amount from 1500 to 2000
  3. Change category from "บริจาค" to "อื่นๆ"
  4. Click Save
- **Expected:** Transaction updated, changelog recorded
- **Validation:** updated_at timestamp changed

### Test Case 3: Delete Transaction
- **Setup:** Select transaction from list
- **Steps:**
  1. Click Delete button
  2. Confirm deletion
- **Expected:** Transaction removed from UI, soft-deleted in DB
- **Validation:** deleted_at timestamp set, balance updated

### Test Case 4: Validation Errors
- **Setup:** Try to create invalid transaction
- **Steps:**
  1. Leave amount empty
  2. Try to submit
- **Expected:** Error message "Amount is required"
- **Validation:** Form doesn't submit

### Test Case 5: Bulk Operations
- **Setup:** Select 5 transactions
- **Steps:**
  1. Select multiple checkboxes
  2. Click "Delete Selected"
  3. Confirm bulk delete
- **Expected:** All selected transactions deleted
- **Validation:** Balance recalculated correctly

### Test Case 6: Filter & Search
- **Setup:** Have 50+ transactions in system
- **Steps:**
  1. Filter by date range: Nov 1-15
  2. Filter by category: "สาธารณูปโภค"
  3. Search: "electricity"
- **Expected:** Only matching transactions displayed
- **Validation:** Result count matches criteria

---

## 🚀 Implementation Tasks

### Task 1: Backend API Implementation
- [ ] Implement POST /api/transactions endpoint with validation
- [ ] Implement GET /api/transactions list with pagination
- [ ] Implement GET /api/transactions/:id endpoint
- [ ] Implement PUT /api/transactions/:id with update logic
- [ ] Implement DELETE /api/transactions/:id soft delete
- [ ] Add database indexes for performance
- [ ] Implement comprehensive error handling
- [ ] Write unit tests for all endpoints
- [ ] Add API documentation with examples
- **Estimated:** 8 hours

### Task 2: Frontend UI Implementation
- [ ] Build TransactionList component with sorting
- [ ] Create TransactionForm for create/edit
- [ ] Build TransactionFilter component
- [ ] Implement pagination controls
- [ ] Add loading states and spinners
- [ ] Build confirmation dialogs
- [ ] Integrate API calls with error handling
- **Estimated:** 8 hours

### Task 3: Validation & Error Handling
- [ ] Client-side validation rules
- [ ] Server-side validation (backend)
- [ ] Consistent error message formatting
- [ ] User-friendly error displays
- [ ] Prevent duplicate submissions
- [ ] Handle network errors gracefully
- **Estimated:** 3 hours

### Task 4: Testing & QA
- [ ] Unit tests (backend: 80% coverage)
- [ ] Integration tests (API + DB)
- [ ] E2E tests (frontend flows)
- [ ] Edge case testing
- [ ] Performance testing (1000+ transactions)
- [ ] User acceptance testing
- **Estimated:** 5 hours

### Task 5: Documentation
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Frontend component documentation
- [ ] User guide for transaction management
- [ ] Troubleshooting guide
- **Estimated:** 2 hours

---

## 🔗 Dependencies

### Required Before This
- ✅ User authentication (completed)
- ✅ Database setup (completed)
- ✅ Category system (Story 003)
- ✅ Date validation (Story 004)

### Blocks These Stories
- Story 001: Dashboard (needs transaction data)
- Story 005: Reports (needs transaction data)
- Story 006: Advanced Search (uses transaction data)

---

## 📊 Data Examples

### Income Transaction
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "income",
  "amount": 5000.00,
  "description": "Buddhist ceremony donations",
  "category_id": "550e8400-e29b-41d4-a716-446655440002",
  "transaction_date": "2025-11-09",
  "created_at": "2025-11-09T10:30:00Z",
  "updated_at": "2025-11-09T10:30:00Z"
}
```

### Expense Transaction
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440003",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "type": "expense",
  "amount": 2500.00,
  "description": "Electricity bill for November",
  "category_id": "550e8400-e29b-41d4-a716-446655440004",
  "transaction_date": "2025-11-08",
  "created_at": "2025-11-08T14:15:00Z",
  "updated_at": "2025-11-08T14:15:00Z"
}
```

---

## ⏱️ Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Planning & Design | 1 day | ✅ Complete |
| Backend Development | 8 hours | ⏳ Pending |
| Frontend Development | 8 hours | ⏳ Pending |
| Validation & Error Handling | 3 hours | ⏳ Pending |
| Testing & QA | 5 hours | ⏳ Pending |
| Documentation | 2 hours | ⏳ Pending |
| **Total** | **27 hours** | |

---

## ✨ Success Metrics

- ✅ All CRUD operations working correctly
- ✅ 100% input validation on client and server
- ✅ API response time < 500ms for typical requests
- ✅ Database handles 10,000+ transactions efficiently
- ✅ Zero data loss on errors
- ✅ User test rating 4.5/5 or higher
- ✅ 80%+ test coverage

---

**Story Created:** November 9, 2025
**Last Updated:** November 9, 2025
**Created By:** Claude Code (BMAD Workflow System)
