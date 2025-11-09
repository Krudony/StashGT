# Story 004: Date Validation UX & Thai Calendar Support

**Epic:** Core Features - Data Validation & UX
**Priority:** 🔥 Priority 1 - Critical
**Status:** TODO
**Assigned to:** Full Stack Team
**Sprint:** Phase 4, Week 1 (Nov 9-10)

---

## 📋 User Story

As a **Temple Accountant**, I want to **enter transaction dates with full validation and support for Thai calendar**, so that **I can ensure data integrity and work with familiar date formats in Thailand**.

---

## 🎯 Acceptance Criteria

### Must Have ✅
- [ ] Client-side date validation preventing invalid dates
- [ ] Server-side date validation with clear error messages
- [ ] Support for valid date range (Jan 1, 2020 - Dec 31, 2030)
- [ ] Reject future dates with user-friendly error message
- [ ] Prevent "impossible" dates (Feb 30, Nov 31, etc.)
- [ ] Handle leap year dates correctly (Feb 29)
- [ ] Display date in Thai format (วันที่ X เดือน X พ.ศ. X)
- [ ] Accept dates in DD/MM/YYYY format
- [ ] Date picker with month/year navigation
- [ ] Current date pre-selected as default
- [ ] Clear error messages for invalid inputs

### Should Have 🟡
- [ ] Thai Buddhist Era (BE) year display (พ.ศ.)
- [ ] Gregorian to Buddhist calendar conversion
- [ ] Date range picker for filters
- [ ] Show last transaction date suggestion
- [ ] Date input with calendar widget
- [ ] Keyboard navigation in date picker

### Nice to Have 🟢
- [ ] Thai holiday highlighting in calendar
- [ ] Buddhist festival dates display
- [ ] Custom date format preferences
- [ ] Date format auto-detection
- [ ] Relative date display (e.g., "2 days ago")

---

## 🔧 Technical Specifications

### Date Validation Rules

```javascript
// Validation rules
const dateValidation = {
  // Minimum date: Jan 1, 2020
  minDate: new Date("2020-01-01"),

  // Maximum date: Dec 31, 2030
  maxDate: new Date("2030-12-31"),

  // Cannot be in future
  allowFuture: false,

  // Leap year support
  handleLeapYear: true,

  // Valid month/day combinations
  daysInMonth: {
    1: 31,  // January
    2: 28,  // February (29 on leap years)
    3: 31,  // March
    4: 30,  // April
    5: 31,  // May
    6: 30,  // June
    7: 31,  // July
    8: 31,  // August
    9: 30,  // September
    10: 31, // October
    11: 30, // November
    12: 31  // December
  }
};
```

### Error Messages (Thai)
```javascript
const errorMessages = {
  REQUIRED: "กรุณากำหนดวันที่",
  INVALID_FORMAT: "รูปแบบวันที่ไม่ถูกต้อง (ใช้ DD/MM/YYYY)",
  INVALID_DATE: "วันที่ไม่ถูกต้อง (เช่น วันที่ 30 กุมภาพันธ์)",
  DATE_TOO_OLD: "วันที่ต้องเป็น 1 มกราคม 2563 หรือหลังจากนั้น",
  DATE_TOO_NEW: "วันที่ต้องเป็น 31 ธันวาคม 2573 หรือก่อนหน้านั้น",
  FUTURE_DATE: "ไม่สามารถใช้วันที่ในอนาคต",
  INVALID_MONTH: "เดือนไม่ถูกต้อง (1-12)",
  INVALID_DAY: "วันไม่ถูกต้อง"
};
```

### Date Conversion Functions

```javascript
// Gregorian to Buddhist Era
function gregorianToBuddhist(gregorianYear) {
  return gregorianYear + 543;
}

// Example: 2025 → 2568 (พ.ศ.)

// Format date as Thai
function formatDateThai(date) {
  const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
  const months = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = gregorianToBuddhist(date.getFullYear());

  return `${day} ${month} ${year}`;
}

// Parse date string DD/MM/YYYY
function parseDateString(dateString) {
  const [day, month, year] = dateString.split('/');
  return new Date(year, month - 1, day);
}

// Validate date is in range
function isDateInRange(date, minDate, maxDate) {
  return date >= minDate && date <= maxDate;
}

// Check if date is in future
function isFutureDate(date) {
  return date > new Date();
}

// Check if leap year
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Validate day for given month/year
function isValidDayForMonth(day, month, year) {
  const daysInMonth = {
    1: 31, 2: isLeapYear(year) ? 29 : 28, 3: 31, 4: 30, 5: 31, 6: 30,
    7: 31, 8: 31, 9: 30, 10: 31, 11: 30, 12: 31
  };
  return day > 0 && day <= daysInMonth[month];
}
```

### API Validation (Backend)

```javascript
// Date validation middleware
const validateTransactionDate = (req, res, next) => {
  const { transaction_date } = req.body;

  if (!transaction_date) {
    return res.status(400).json({ error: "Transaction date is required" });
  }

  const date = new Date(transaction_date);

  // Check valid date format
  if (isNaN(date.getTime())) {
    return res.status(400).json({ error: "Invalid date format" });
  }

  // Check date range
  const minDate = new Date("2020-01-01");
  const maxDate = new Date("2030-12-31");

  if (date < minDate || date > maxDate) {
    return res.status(400).json({
      error: "Date must be between 2020-01-01 and 2030-12-31"
    });
  }

  // Check not in future
  if (date > new Date()) {
    return res.status(400).json({ error: "Cannot use future date" });
  }

  next();
};
```

### Frontend Component

```javascript
// DateInput Component in React
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export function DateInput({ value, onChange, error }) {
  const [inputValue, setInputValue] = useState('');

  const formatThai = (date) => {
    // Implementation of Thai date formatting
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear() + 543; // Convert to Buddhist Era
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (date) => {
    if (date) {
      onChange(date);
      setInputValue(formatThai(date));
    }
  };

  return (
    <div className="date-input-group">
      <DatePicker
        selected={value}
        onChange={handleDateChange}
        minDate={new Date("2020-01-01")}
        maxDate={new Date("2030-12-31")}
        filterDate={(date) => date <= new Date()}
        dateFormat="dd/MM/yyyy"
        placeholderText="DD/MM/YYYY"
        className="date-input"
      />
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}
```

---

## 📊 Test Scenarios

### Test Case 1: Valid Date Input
- **Steps:**
  1. Enter date: 09/11/2025
  2. Verify date parsed correctly
  3. Submit transaction
- **Expected:** Date accepted, transaction created
- **Validation:** Database stores date correctly

### Test Case 2: Invalid Month
- **Steps:**
  1. Enter date: 15/13/2025 (month 13)
  2. Try to submit
- **Expected:** Error "เดือนไม่ถูกต้อง (1-12)"
- **Validation:** Form doesn't submit

### Test Case 3: Feb 30 (Invalid Day)
- **Steps:**
  1. Enter date: 30/02/2025
  2. Try to submit
- **Expected:** Error "วันที่ไม่ถูกต้อง"
- **Validation:** Form doesn't submit

### Test Case 4: Feb 29 (Leap Year)
- **Steps:**
  1. Enter date: 29/02/2024 (leap year)
  2. Submit transaction
- **Expected:** Date accepted
- **Validation:** Database stores correctly

### Test Case 5: Future Date
- **Steps:**
  1. Enter date: 25/12/2025 (future)
  2. Try to submit
- **Expected:** Error "ไม่สามารถใช้วันที่ในอนาคต"
- **Validation:** Form doesn't submit

### Test Case 6: Out of Range
- **Steps:**
  1. Enter date: 01/01/2019 (before 2020)
  2. Try to submit
- **Expected:** Error "วันที่ต้องเป็น 1 มกราคม 2563 หรือหลังจากนั้น"
- **Validation:** Form doesn't submit

### Test Case 7: Thai Date Display
- **Steps:**
  1. Select date in date picker
  2. Verify display shows Thai format
  3. Check Buddhist Era year shown
- **Expected:** Displays "9 พฤศจิกายน 2568"
- **Validation:** Correct conversion applied

### Test Case 8: Date Picker Navigation
- **Steps:**
  1. Open date picker
  2. Click next/previous month buttons
  3. Select year from dropdown
- **Expected:** Calendar navigates smoothly
- **Validation:** All months accessible

---

## 🚀 Implementation Tasks

### Task 1: Create Date Utility Functions
- [ ] Implement date validation functions (range, format, leap year)
- [ ] Create date parsing and formatting functions
- [ ] Implement Gregorian to Buddhist Era conversion
- [ ] Create error message constants
- [ ] Write unit tests for all utilities
- [ ] Document all functions
- **Estimated:** 3 hours

### Task 2: Backend Validation
- [ ] Create date validation middleware
- [ ] Implement server-side date validation
- [ ] Add database constraints for date values
- [ ] Test validation with edge cases
- [ ] Add comprehensive error handling
- [ ] Create validation test suite
- **Estimated:** 2 hours

### Task 3: Frontend Date Input Component
- [ ] Build DateInput component with date picker
- [ ] Implement Thai date formatting
- [ ] Add client-side validation
- [ ] Create error message display
- [ ] Implement keyboard navigation
- [ ] Add accessibility features (ARIA labels)
- [ ] Test across browsers
- **Estimated:** 4 hours

### Task 4: Integration
- [ ] Integrate date validation in transaction form
- [ ] Test end-to-end validation flow
- [ ] Test with various date formats
- [ ] Verify Thai display works correctly
- [ ] Test error handling on server
- [ ] User acceptance testing
- **Estimated:** 2 hours

### Task 5: Documentation
- [ ] API validation documentation
- [ ] Component documentation
- [ ] Date format guide for users
- [ ] Troubleshooting guide
- **Estimated:** 1 hour

---

## 🔗 Dependencies

### Required Before This
- ✅ User authentication (completed)
- ✅ Database setup (completed)

### Blocks These Stories
- Story 002: Transaction Management (uses date validation)
- Story 001: Dashboard (depends on valid dates)

### Related Stories
- Story 002: Transaction Management (uses date validation)
- Story 003: Category Management (for transaction creation)

---

## 📊 Data Examples

### Valid Date Inputs
```javascript
// All should be accepted
const validDates = [
  "01/01/2020", // First valid date
  "29/02/2024", // Leap year Feb 29
  "31/12/2030", // Last valid date
  "09/11/2025", // Current
];

// Thai format display
formatDateThai(new Date("2025-11-09")); // "9 พฤศจิกายน 2568"
```

### Invalid Date Inputs
```javascript
// All should be rejected with specific errors
const invalidDates = [
  { date: "32/11/2025", error: "Invalid day" },
  { date: "31/04/2025", error: "April has 30 days" },
  { date: "29/02/2025", error: "Not a leap year" },
  { date: "25/12/2025", error: "Cannot use future date" },
  { date: "01/01/2019", error: "Date too old" },
];
```

---

## ⏱️ Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Date Utility Functions | 3 hours | ⏳ Pending |
| Backend Validation | 2 hours | ⏳ Pending |
| Frontend Component | 4 hours | ⏳ Pending |
| Integration & Testing | 2 hours | ⏳ Pending |
| Documentation | 1 hour | ⏳ Pending |
| **Total** | **12 hours** | |

---

## ✨ Success Metrics

- ✅ All invalid dates rejected with clear error messages
- ✅ All valid dates (2020-2030) accepted correctly
- ✅ Leap year dates handled correctly
- ✅ Thai date display works perfectly
- ✅ Client-side validation prevents invalid submissions
- ✅ Server-side validation enforces constraints
- ✅ User satisfaction rating 4.5/5 or higher
- ✅ 100% test coverage for date validation

---

**Story Created:** November 9, 2025
**Last Updated:** November 9, 2025
**Created By:** Claude Code (BMAD Workflow System)
