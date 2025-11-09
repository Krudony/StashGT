# Story 003: Category Management Interface

**Epic:** Core Features - Category Management
**Priority:** 🔥 Priority 1 - Critical
**Status:** TODO
**Assigned to:** Full Stack Team
**Sprint:** Phase 4, Week 1 (Nov 9-10)

---

## 📋 User Story

As a **Temple Accountant**, I want to **manage transaction categories with full CRUD operations**, so that **I can organize temple finances by meaningful categories and customize them based on temple-specific needs**.

---

## 🎯 Acceptance Criteria

### Must Have ✅
- [ ] View all user categories in organized list/grid
- [ ] Create new categories with name and optional description
- [ ] Edit category name and description
- [ ] Delete categories (with validation to prevent orphaned transactions)
- [ ] Default categories auto-created for new users
- [ ] Category color/icon assignment for visual distinction
- [ ] Prevent duplicate category names per user
- [ ] Assign categories to transactions during creation
- [ ] Show category usage count (number of transactions)
- [ ] Categories properly linked to transactions via foreign key

### Should Have 🟡
- [ ] Category hierarchy/subcategories support
- [ ] Bulk operations (import categories, copy from template)
- [ ] Category templates (common temple categories)
- [ ] Merge duplicate categories
- [ ] Category activity history
- [ ] Export/import categories

### Nice to Have 🟢
- [ ] Category presets from different temple types
- [ ] AI suggestions for optimal categorization
- [ ] Category budgeting and limits
- [ ] Category-based alerts and notifications

---

## 🔧 Technical Specifications

### Database Schema
```sql
-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
  icon VARCHAR(50) DEFAULT 'folder', -- Icon name from icon library
  transaction_type VARCHAR(20), -- 'income', 'expense', or NULL for both
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, name)
);

-- Alter transactions table to add foreign key
ALTER TABLE transactions
ADD COLUMN category_id UUID REFERENCES categories(id);

-- Create indexes
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_created_at ON categories(user_id, created_at DESC);
```

### Default Categories for New Users
When a new user is created, automatically create these categories:

```javascript
const defaultCategories = [
  // Income Categories
  { name: "บริจาค (Donations)", type: "income", color: "#10B981", icon: "gift" },
  { name: "อื่นๆ (Other Income)", type: "income", color: "#3B82F6", icon: "coins" },

  // Expense Categories
  { name: "สาธารณูปโภค (Utilities)", type: "expense", color: "#EF4444", icon: "lightbulb" },
  { name: "อาหาร (Food)", type: "expense", color: "#F59E0B", icon: "utensils" },
  { name: "ซ่อมแซม (Maintenance)", type: "expense", color: "#8B5CF6", icon: "wrench" },
  { name: "กิจกรรม (Activities)", type: "expense", color: "#EC4899", icon: "calendar" },
  { name: "การศึกษา (Education)", type: "expense", color: "#06B6D4", icon: "book" },
  { name: "อื่นๆ (Other Expense)", type: "expense", color: "#6B7280", icon: "folder" }
];
```

### API Endpoints

```
GET /api/categories
- List all user's categories
- Query: ?type=income|expense (optional)
- Response: { total, data: [...], pagination: {} }
- Status: 200 OK

POST /api/categories
- Create new category
- Body: { name, description, color, icon, transaction_type }
- Response: { id, ...category_data }
- Status: 201 Created

GET /api/categories/:id
- Get single category details with transaction count
- Response: { ...category_data, transaction_count: 15 }
- Status: 200 OK

PUT /api/categories/:id
- Update category
- Body: { name, description, color, icon }
- Response: { ...updated_category }
- Status: 200 OK

DELETE /api/categories/:id
- Delete category with validation
- Response: { success: true, message: "Category deleted" }
- Validation: Check if category has transactions
- Status: 200 OK or 409 Conflict if has transactions
```

### Frontend Components
**Files:**
- `temple-accounting-frontend/src/pages/CategoryPage.jsx`
- `temple-accounting-frontend/src/components/Category/*`

Components needed:
1. **CategoryList** - Table/Grid view of categories
2. **CategoryForm** - Create/Edit category modal
3. **CategorySelector** - Dropdown/Select for transaction forms
4. **CategoryBadge** - Visual representation of category
5. **CategoryStats** - Show usage count and trends
6. **DefaultCategorySetup** - First-time setup wizard

---

## 📊 Color & Icon Palette

### Suggested Colors
```javascript
const categoryColors = {
  income: "#10B981",      // Green
  donations: "#34D399",   // Light Green
  utilities: "#EF4444",   // Red
  food: "#F59E0B",        // Amber
  maintenance: "#8B5CF6", // Purple
  activities: "#EC4899",  // Pink
  education: "#06B6D4",   // Cyan
  health: "#F87171",      // Light Red
  other: "#6B7280"        // Gray
};
```

### Icon Library
- Use React Icons (react-icons) with FontAwesome, Feather, or Material Design Icons
- Example mappings:
  - Utilities: FaLightbulb, FaWater
  - Food: FaUtensils, FaAppleAlt
  - Maintenance: FaWrench, FaHammer
  - Activities: FaCalendar, FaMusic
  - Education: FaBook, FaGraduationCap
  - Donations: FaHandHeart, FaHeart

---

## 🧪 Test Scenarios

### Test Case 1: Create Category
- **Setup:** Login to new user account
- **Steps:**
  1. Navigate to Categories
  2. Click "Add Category"
  3. Enter name: "บ้านพยาบาล"
  4. Enter description: "Healthcare costs"
  5. Select color: Red (#EF4444)
  6. Select icon: Heart
  7. Set type: "expense"
  8. Click Save
- **Expected:** Category appears in list with correct settings
- **Validation:** Database record created

### Test Case 2: Default Categories Created
- **Setup:** Create new user account
- **Steps:**
  1. Register new account
  2. Navigate to Categories page
- **Expected:** 8 default categories pre-populated
- **Validation:** All default categories visible and functional

### Test Case 3: Edit Category
- **Setup:** Select existing category
- **Steps:**
  1. Click Edit
  2. Change name to "การแพทย์"
  3. Change description
  4. Save changes
- **Expected:** Category updated with new values
- **Validation:** updated_at timestamp changed

### Test Case 4: Delete Category (with transactions)
- **Setup:** Category has 5 transactions assigned
- **Steps:**
  1. Try to delete category
- **Expected:** Error message "Cannot delete category with transactions"
- **Validation:** Category remains in system

### Test Case 5: Delete Category (empty)
- **Setup:** New category with no transactions
- **Steps:**
  1. Delete category
  2. Confirm deletion
- **Expected:** Category removed from list
- **Validation:** Database record deleted

### Test Case 6: Assign Category to Transaction
- **Setup:** Creating new transaction
- **Steps:**
  1. Open transaction form
  2. Click category dropdown
  3. Select "บ้านพยาบาล"
  4. Verify category displayed
- **Expected:** Category properly linked to transaction
- **Validation:** Transaction saves with category_id

### Test Case 7: Category Usage Stats
- **Setup:** Multiple transactions in various categories
- **Steps:**
  1. View category list
  2. Check transaction count for each category
- **Expected:** Accurate count displayed (e.g., "15 transactions")
- **Validation:** Count matches actual transactions

---

## 🚀 Implementation Tasks

### Task 1: Database Setup
- [ ] Create categories table with proper schema
- [ ] Add foreign key to transactions table
- [ ] Create unique constraint on (user_id, name)
- [ ] Create performance indexes
- [ ] Write migration script
- [ ] Test schema with sample data
- **Estimated:** 2 hours

### Task 2: Backend API Implementation
- [ ] Implement GET /api/categories list endpoint
- [ ] Implement POST /api/categories create endpoint
- [ ] Implement GET /api/categories/:id with usage count
- [ ] Implement PUT /api/categories/:id update endpoint
- [ ] Implement DELETE /api/categories/:id with validation
- [ ] Add automatic default categories creation on user signup
- [ ] Write unit tests for all endpoints
- **Estimated:** 5 hours

### Task 3: Frontend Components
- [ ] Build CategoryList component with sorting/filtering
- [ ] Create CategoryForm (create/edit modal)
- [ ] Build CategorySelector dropdown for transactions
- [ ] Create CategoryBadge component with color/icon
- [ ] Build stats display showing usage count
- [ ] Add loading states and error handling
- [ ] Implement confirmation dialogs
- **Estimated:** 5 hours

### Task 4: Integration & Testing
- [ ] Connect frontend to backend API
- [ ] Test category creation for new users
- [ ] Test category assignment to transactions
- [ ] Test validation (duplicate names, etc.)
- [ ] Test delete with transaction validation
- [ ] End-to-end testing
- [ ] Performance testing with many categories
- **Estimated:** 3 hours

### Task 5: Documentation
- [ ] API documentation
- [ ] Component documentation
- [ ] User guide for category management
- [ ] Category best practices guide
- **Estimated:** 1 hour

---

## 🔗 Dependencies

### Required Before This
- ✅ User authentication (completed)
- ✅ Database setup (completed)
- Story 004: Date Validation (for transaction creation)

### Blocks These Stories
- Story 001: Dashboard (needs category data for charts)
- Story 002: Transaction Management (needs categories)
- Story 005: Reports (needs category grouping)

### Related Stories
- Story 002: Transaction Management (uses categories)
- Story 006: Advanced Search (filter by category)

---

## 📊 Data Example

### Category List Response
```json
{
  "total": 8,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "บริจาค (Donations)",
      "description": "Income from Buddhist donations",
      "color": "#10B981",
      "icon": "gift",
      "transaction_type": "income",
      "is_default": true,
      "transaction_count": 25,
      "created_at": "2025-11-09T10:00:00Z",
      "updated_at": "2025-11-09T10:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "สาธารณูปโภค (Utilities)",
      "description": "Electricity, water, internet bills",
      "color": "#EF4444",
      "icon": "lightbulb",
      "transaction_type": "expense",
      "is_default": true,
      "transaction_count": 12,
      "created_at": "2025-11-09T10:00:00Z",
      "updated_at": "2025-11-09T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 8,
    "limit": 20,
    "offset": 0
  }
}
```

---

## ⏱️ Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Database Design & Setup | 2 hours | ⏳ Pending |
| Backend API Development | 5 hours | ⏳ Pending |
| Frontend Component Development | 5 hours | ⏳ Pending |
| Integration & Testing | 3 hours | ⏳ Pending |
| Documentation | 1 hour | ⏳ Pending |
| **Total** | **16 hours** | |

---

## ✨ Success Metrics

- ✅ All CRUD operations working correctly
- ✅ Default categories auto-created for new users
- ✅ Proper validation (no duplicate names, no orphaned transactions)
- ✅ Category colors/icons display correctly
- ✅ Transaction count accurate
- ✅ API response time < 300ms
- ✅ User test rating 4/5 or higher

---

**Story Created:** November 9, 2025
**Last Updated:** November 9, 2025
**Created By:** Claude Code (BMAD Workflow System)
