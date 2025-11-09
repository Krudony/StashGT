# Story 006: Advanced Search & Filtering System

**Epic:** Core Features - Search & Discovery
**Priority:** 🟡 Priority 2 - High
**Status:** TODO
**Assigned to:** Full Stack Team
**Sprint:** Phase 4, Week 2 (Nov 14-16)

---

## 📋 User Story

As a **Temple Accountant**, I want to **search and filter transactions using multiple criteria** such as date range, amount range, category, and keywords, so that **I can quickly find specific transactions and analyze financial patterns**.

---

## 🎯 Acceptance Criteria

### Must Have ✅
- [ ] Search transactions by description (keyword search)
- [ ] Filter by date range (from date, to date)
- [ ] Filter by amount range (min amount, max amount)
- [ ] Filter by category (single or multiple)
- [ ] Filter by transaction type (income/expense)
- [ ] Combine multiple filters (AND logic)
- [ ] Results display with pagination
- [ ] Sort results by date, amount, or category
- [ ] Show filter summary/active filters
- [ ] Clear all filters button
- [ ] Save favorite filter searches
- [ ] Search performance < 1 second for typical volumes

### Should Have 🟡
- [ ] Advanced search syntax (operators: >, <, =, contains, etc.)
- [ ] Search history with suggestions
- [ ] Filter presets (Today, This Week, This Month, etc.)
- [ ] Export search results
- [ ] Saved searches with names
- [ ] Search analytics (popular searches)
- [ ] Fuzzy search for typos
- [ ] Search highlighting in results

### Nice to Have 🟢
- [ ] Voice search functionality
- [ ] AI-powered search suggestions
- [ ] Saved search sharing between users
- [ ] Smart filters (Recent, Large Transactions, etc.)
- [ ] Search within search results

---

## 🔧 Technical Specifications

### Backend API Endpoints

```
GET /api/transactions/search
- Advanced search with multiple filters
- Query Parameters:
  - q: string (keyword search in description)
  - startDate: YYYY-MM-DD (start of date range)
  - endDate: YYYY-MM-DD (end of date range)
  - minAmount: number (minimum transaction amount)
  - maxAmount: number (maximum transaction amount)
  - categories: UUID[] (category IDs, comma-separated)
  - type: 'income'|'expense' (transaction type)
  - sortBy: 'date'|'amount'|'category' (sort field)
  - sortOrder: 'asc'|'desc' (sort direction)
  - limit: number (default 20, max 100)
  - offset: number (pagination offset)

- Response:
{
  "total": 150,
  "limit": 20,
  "offset": 0,
  "data": [
    {
      "id": "uuid",
      "description": "Sunday donation",
      "amount": 5000.00,
      "type": "income",
      "category": { "id": "uuid", "name": "บริจาค" },
      "date": "2025-11-09",
      "highlights": { "description": "...<mark>donation</mark>..." }
    }
  ],
  "filters": {
    "applied": {
      "q": "donation",
      "type": "income",
      "startDate": "2025-11-01",
      "endDate": "2025-11-30"
    }
  }
}

- Status: 200 OK

GET /api/transactions/search/history
- Get recent search history
- Response: { searches: [{ id, query, date, resultCount }, ...] }
- Status: 200 OK

GET /api/transactions/search/presets
- Get filter presets
- Response: {
    presets: [
      { id: "today", name: "Today", filters: { ... } },
      { id: "thisWeek", name: "This Week", filters: { ... } },
      { id: "thisMonth", name: "This Month", filters: { ... } }
    ]
  }
- Status: 200 OK

POST /api/transactions/search/save
- Save search with name
- Body: { name: "String", filters: { ...filterObj } }
- Response: { id, name, filters, created_at }
- Status: 201 Created

GET /api/transactions/search/saved
- Get user's saved searches
- Response: { searches: [...] }
- Status: 200 OK
```

### Search Implementation

```javascript
// Backend: Advanced search function
async function searchTransactions(userId, filters) {
  let query = db('transactions')
    .where('user_id', userId)
    .whereNull('deleted_at');

  // Keyword search (search in description)
  if (filters.q) {
    query = query.whereRaw(
      'LOWER(description) LIKE ?',
      [`%${filters.q.toLowerCase()}%`]
    );
  }

  // Date range filter
  if (filters.startDate) {
    query = query.where('transaction_date', '>=', filters.startDate);
  }
  if (filters.endDate) {
    query = query.where('transaction_date', '<=', filters.endDate);
  }

  // Amount range filter
  if (filters.minAmount) {
    query = query.where('amount', '>=', filters.minAmount);
  }
  if (filters.maxAmount) {
    query = query.where('amount', '<=', filters.maxAmount);
  }

  // Category filter (multiple)
  if (filters.categories && filters.categories.length > 0) {
    query = query.whereIn('category_id', filters.categories);
  }

  // Type filter
  if (filters.type) {
    query = query.where('transaction_type', filters.type);
  }

  // Sorting
  const sortBy = filters.sortBy || 'transaction_date';
  const sortOrder = filters.sortOrder || 'desc';
  query = query.orderBy(sortBy, sortOrder);

  // Pagination
  const limit = Math.min(filters.limit || 20, 100);
  const offset = filters.offset || 0;

  const total = await query.clone().count('* as cnt').first();
  const data = await query.limit(limit).offset(offset);

  return {
    total: total.cnt,
    limit,
    offset,
    data,
    filters: {
      applied: filters
    }
  };
}
```

### Frontend Components

```javascript
// SearchFilter Component structure
SearchFilterPanel
├── KeywordInput (search box with debouncing)
├── DateRangeFilter
│   ├── StartDateInput
│   └── EndDateInput
├── AmountRangeFilter
│   ├── MinAmountInput
│   └── MaxAmountInput
├── CategoryMultiSelect
├── TypeRadioButtons (income/expense/both)
├── SortOptions
├── FilterButtons
│   ├── Apply Filters Button
│   ├── Clear All Filters Button
│   └── Save Search Button
└── ActiveFiltersDisplay
    ├── FilterTag (removable)
    ├── FilterTag (removable)
    └── ...

SearchResults Component
├── ResultsSummary (showing X results)
├── SortOptions (sort, order)
└── ResultsList
    ├── TransactionRow (with highlights)
    ├── TransactionRow (with highlights)
    └── Pagination
```

---

## 🧪 Test Scenarios

### Test Case 1: Keyword Search
- **Setup:** Multiple transactions with "donation" in description
- **Steps:**
  1. Enter "donation" in search box
  2. Click Search or wait for auto-search
  3. Review results
- **Expected:**
  - Only transactions with "donation" returned
  - Keyword highlighted in results
  - Results < 1 second
- **Validation:** Count matches manual verification

### Test Case 2: Date Range Filter
- **Steps:**
  1. Set start date: 2025-11-01
  2. Set end date: 2025-11-15
  3. Apply filters
- **Expected:**
  - Only transactions within date range shown
  - Summary shows applied filters
- **Validation:** All dates in range correct

### Test Case 3: Amount Range Filter
- **Steps:**
  1. Set min amount: 1000
  2. Set max amount: 5000
  3. Apply filter
- **Expected:**
  - Only transactions 1000-5000 shown
  - Can combine with other filters
- **Validation:** Amount boundaries correct

### Test Case 4: Multiple Category Filter
- **Steps:**
  1. Select categories: "บริจาค", "กิจกรรม"
  2. Apply filter
- **Expected:**
  - Only transactions in selected categories shown
  - Shows which categories filtered
- **Validation:** All results match selected categories

### Test Case 5: Combined Filters
- **Steps:**
  1. Set date range: Nov 1-15
  2. Set type: Expense
  3. Set categories: "สาธารณูปโภค"
  4. Enter keyword: "electricity"
  5. Apply all filters
- **Expected:**
  - Only transactions matching ALL criteria shown
  - Summary shows all active filters
- **Validation:** Complex filter logic works

### Test Case 6: Sort Results
- **Steps:**
  1. Apply some filters
  2. Sort by amount (ascending)
  3. Change to sort by date (descending)
- **Expected:**
  - Results reorder immediately
  - Sorting persists with pagination
- **Validation:** Correct sort order maintained

### Test Case 7: Save Search
- **Steps:**
  1. Apply filters for regular search
  2. Click "Save this search"
  3. Enter name: "Monthly utilities"
  4. Save
- **Expected:** Search saved and accessible later
- **Validation:** Saved search appears in list

### Test Case 8: Clear Filters
- **Steps:**
  1. Apply multiple filters
  2. Click "Clear All Filters"
- **Expected:** All filters removed, shows all transactions
- **Validation:** UI reflects cleared state

### Test Case 9: Pagination
- **Setup:** 150+ transactions
- **Steps:**
  1. Apply search returning 50+ results
  2. Navigate to page 2
  3. Go to last page
- **Expected:**
  - Results paginated correctly
  - Page navigation works
  - Correct record count per page
- **Validation:** No data loss, all records accessible

### Test Case 10: Empty Results
- **Steps:**
  1. Search for non-existent transaction
  2. Apply impossible filter combination
- **Expected:** Friendly "No results found" message
- **Validation:** Helpful message shown

---

## 🚀 Implementation Tasks

### Task 1: Backend Search Implementation
- [ ] Implement advanced search query builder
- [ ] Add keyword search with LIKE operator
- [ ] Implement date range filtering
- [ ] Implement amount range filtering
- [ ] Implement category multi-select filtering
- [ ] Implement sorting options
- [ ] Add pagination support
- [ ] Optimize queries with proper indexes
- [ ] Write unit tests for search logic
- [ ] Add performance benchmarks
- **Estimated:** 6 hours

### Task 2: Search API Endpoints
- [ ] Create GET /api/transactions/search endpoint
- [ ] Create GET /api/transactions/search/history endpoint
- [ ] Create GET /api/transactions/search/presets endpoint
- [ ] Create POST /api/transactions/search/save endpoint
- [ ] Create GET /api/transactions/search/saved endpoint
- [ ] Add input validation for all params
- [ ] Add error handling
- [ ] Create API tests
- **Estimated:** 3 hours

### Task 3: Frontend Search UI
- [ ] Build SearchFilterPanel component
- [ ] Create KeywordInput with debouncing
- [ ] Build DateRangeFilter component
- [ ] Build AmountRangeFilter component
- [ ] Create CategoryMultiSelect component
- [ ] Build FilterButtons (apply, clear, save)
- [ ] Create ActiveFiltersDisplay
- [ ] Implement sort options
- **Estimated:** 5 hours

### Task 4: Search Results Display
- [ ] Build SearchResults component
- [ ] Create ResultsSummary
- [ ] Implement result highlighting
- [ ] Create Pagination controls
- [ ] Add loading states
- [ ] Add empty state messaging
- [ ] Mobile responsive design
- **Estimated:** 3 hours

### Task 5: Saved Searches
- [ ] Create SaveSearchModal
- [ ] Build SavedSearchesList
- [ ] Implement load saved search
- [ ] Add delete saved search
- [ ] Create management interface
- **Estimated:** 2 hours

### Task 6: Integration & Testing
- [ ] End-to-end testing of search flow
- [ ] Performance testing with large datasets
- [ ] Test all filter combinations
- [ ] Test pagination with filters
- [ ] User acceptance testing
- [ ] Accessibility testing
- **Estimated:** 3 hours

### Task 7: Documentation
- [ ] API documentation for search endpoints
- [ ] Component documentation
- [ ] User guide for search features
- [ ] Search tips and tricks guide
- **Estimated:** 1 hour

---

## 🔗 Dependencies

### Required Before This
- Story 002: Transaction Management (needs transaction data)
- Story 003: Category Management (for category filtering)
- Story 004: Date Validation (for date range filters)

### Related Stories
- Story 001: Dashboard (may use similar data)
- Story 005: Reports (may use similar filtering)

---

## 📊 Search Query Examples

### Example 1: Simple Keyword Search
```
GET /api/transactions/search?q=donation
```

### Example 2: Date Range + Category
```
GET /api/transactions/search?startDate=2025-11-01&endDate=2025-11-30&categories=uuid1,uuid2
```

### Example 3: Amount Range + Type
```
GET /api/transactions/search?minAmount=1000&maxAmount=5000&type=expense
```

### Example 4: Complex Search
```
GET /api/transactions/search?q=electricity&startDate=2025-11-01&endDate=2025-11-30&categories=uuid&type=expense&sortBy=amount&sortOrder=desc&limit=50&offset=0
```

---

## ⏱️ Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Backend Search Implementation | 6 hours | ⏳ Pending |
| Search API Endpoints | 3 hours | ⏳ Pending |
| Frontend Search UI | 5 hours | ⏳ Pending |
| Search Results Display | 3 hours | ⏳ Pending |
| Saved Searches | 2 hours | ⏳ Pending |
| Integration & Testing | 3 hours | ⏳ Pending |
| Documentation | 1 hour | ⏳ Pending |
| **Total** | **23 hours** | |

---

## ✨ Success Metrics

- ✅ Keyword search works with case-insensitive matching
- ✅ All filter combinations work correctly
- ✅ Search results appear < 1 second
- ✅ Pagination handles large result sets
- ✅ Saved searches persist and load correctly
- ✅ Filter UI is intuitive and responsive
- ✅ 100% test coverage for search logic
- ✅ User satisfaction rating 4/5 or higher

---

**Story Created:** November 9, 2025
**Last Updated:** November 9, 2025
**Created By:** Claude Code (BMAD Workflow System)
