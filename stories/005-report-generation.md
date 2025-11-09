# Story 005: Report Generation & Export Functionality

**Epic:** Core Features - Reporting & Analytics
**Priority:** 🟡 Priority 2 - High
**Status:** TODO
**Assigned to:** Full Stack Team
**Sprint:** Phase 4, Week 1 (Nov 11-13)

---

## 📋 User Story

As a **Temple Accountant**, I want to **generate and export financial reports in PDF and Excel formats** with flexible date ranges and filtering, so that **I can create reports for stakeholders and maintain financial records**.

---

## 🎯 Acceptance Criteria

### Must Have ✅
- [ ] Generate PDF reports with proper formatting
- [ ] Export data to Excel (.xlsx) with multiple sheets
- [ ] Support custom date range selection
- [ ] Filter reports by category
- [ ] Include summary statistics (total income, expense, balance)
- [ ] Show transaction details in report
- [ ] Include category breakdown summary
- [ ] Proper pagination for large reports
- [ ] Thailand-specific formatting (Thai Baht, Thai date)
- [ ] Report header with temple information and date range
- [ ] Performance: Generate reports < 5 seconds for 1000+ transactions

### Should Have 🟡
- [ ] Monthly/quarterly/annual preset reports
- [ ] Comparison reports (month-to-month, year-to-year)
- [ ] Budget vs actual analysis
- [ ] Customizable report template
- [ ] Email report functionality
- [ ] Schedule automated report generation
- [ ] Report history/archiving

### Nice to Have 🟢
- [ ] Chart/graph visualizations in PDF
- [ ] Data visualization in Excel (charts, conditional formatting)
- [ ] Report branding (temple logo, colors)
- [ ] Multi-language reports (Thai/English)
- [ ] Report signing/approval workflow

---

## 🔧 Technical Specifications

### Backend API Endpoints

```
GET /api/reports/transactions
- Get transactions for report with filters
- Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&category=id&type=income|expense
- Response: { data: [...], summary: { income, expense, balance } }
- Status: 200 OK

POST /api/reports/generate-pdf
- Generate PDF report
- Body: { startDate, endDate, categoryId, type, includeDetails }
- Response: PDF file (application/pdf)
- Status: 200 OK

POST /api/reports/generate-excel
- Generate Excel report
- Body: { startDate, endDate, categoryId, type, format: 'simple|detailed' }
- Response: Excel file (application/vnd.openxmlformats-officedocument.spreadsheetml.sheet)
- Status: 200 OK

GET /api/reports/presets
- Get available report presets
- Response: { presets: [{ name, type, dateRange }, ...] }
- Status: 200 OK
```

### PDF Report Structure

```
┌─────────────────────────────────┐
│     TEMPLE NAME                 │
│   Financial Report              │
│   Date Range: Nov 1 - 30, 2568  │
└─────────────────────────────────┘

Summary Section:
  Total Income:     ฿ 45,000.00
  Total Expense:    ฿ 32,000.00
  Net Balance:      ฿ 13,000.00

Category Breakdown:
  Category Name          Amount        % of Total
  ─────────────────────────────────────
  บริจาค                 ฿45,000.00     100%
  สาธารณูปโภค            ฿5,000.00      15.6%
  ...

Detailed Transactions:
  Date    Description         Category      Type      Amount
  ─────────────────────────────────────────────────
  Nov 9   Sunday donation      บริจาค      Income   ฿5,000.00
  Nov 8   Electricity bill     สาธารณูปโภค Expense  ฿2,500.00
  ...

Generated: Nov 9, 2568 at 14:30 ICT
```

### Excel Report Structure

**Sheet 1: Summary**
- Temple name, report period
- Total income, expense, balance
- Key metrics and ratios

**Sheet 2: Category Breakdown**
- Category name
- Count of transactions
- Total amount
- Percentage of total

**Sheet 3: Transaction Details**
- Date (Thai format)
- Description
- Category
- Type
- Amount
- Running balance (optional)

**Sheet 4: Trends** (for monthly/yearly reports)
- Month/Year
- Income
- Expense
- Balance
- Trends visualization

### Libraries

**PDF Generation:**
```javascript
// Using PDFKit or jsPDF
const PDFDocument = require('pdfkit');

// Create document
const doc = new PDFDocument();

// Add content
doc.fontSize(16).text('Financial Report', 100, 100);
doc.fontSize(12).text(`Period: ${startDate} - ${endDate}`, 100, 130);

// Add summary
doc.text('Summary', 100, 200);
doc.text(`Income: ฿ ${formatCurrency(income)}`, 120, 220);
doc.text(`Expense: ฿ ${formatCurrency(expense)}`, 120, 240);

// Add table (use table library or manual layout)
// ...

// Save
doc.pipe(fs.createWriteStream('report.pdf'));
doc.end();
```

**Excel Generation:**
```javascript
// Using ExcelJS
const ExcelJS = require('exceljs');

const workbook = new ExcelJS.Workbook();

// Add Summary sheet
const summarySheet = workbook.addWorksheet('Summary');
summarySheet.columns = [
  { header: 'Metric', key: 'metric' },
  { header: 'Value', key: 'value' }
];
summarySheet.addRows([
  { metric: 'Total Income', value: income },
  { metric: 'Total Expense', value: expense }
]);

// Add Transactions sheet
const transSheet = workbook.addWorksheet('Transactions');
transSheet.columns = [
  { header: 'Date', key: 'date' },
  { header: 'Description', key: 'description' },
  { header: 'Category', key: 'category' },
  { header: 'Type', key: 'type' },
  { header: 'Amount', key: 'amount' }
];
transSheet.addRows(transactions);

// Save
await workbook.xlsx.writeFile('report.xlsx');
```

---

## 🧪 Test Scenarios

### Test Case 1: Generate PDF - Current Month
- **Setup:** Transaction data for November 2025
- **Steps:**
  1. Select report type: PDF
  2. Set date range: Nov 1-30, 2025
  3. Click "Generate Report"
  4. Download PDF
- **Expected:** PDF downloads successfully
- **Validation:**
  - PDF renders correctly
  - Shows correct date range
  - Includes summary section
  - Shows all transactions

### Test Case 2: Generate Excel - Custom Date Range
- **Setup:** Multiple categories with transactions
- **Steps:**
  1. Select report type: Excel
  2. Set custom date range: Oct 15 - Nov 10
  3. Filter by category: "สาธารณูปโภค"
  4. Click "Generate Report"
- **Expected:** Excel file downloads with filtered data
- **Validation:**
  - Excel opens without errors
  - Contains only filtered transactions
  - Multiple sheets present
  - Summary correct

### Test Case 3: PDF with No Transactions
- **Setup:** Date range with no transactions
- **Steps:**
  1. Generate PDF for empty date range
- **Expected:** PDF generated with empty state message
- **Validation:** Professional "No data" message displayed

### Test Case 4: Large Dataset (5000+ Transactions)
- **Setup:** Report with 5000+ transactions
- **Steps:**
  1. Generate Excel report
  2. Measure generation time
- **Expected:** Report generated < 5 seconds
- **Validation:** File opens without memory issues

### Test Case 5: Thai Date & Currency Formatting
- **Steps:**
  1. Generate any report
  2. Verify date formatting
  3. Verify currency formatting
- **Expected:**
  - Dates show "9 พฤศจิกายน 2568"
  - Currency shows "฿ 1,234.56"
  - Baht symbol displays correctly

### Test Case 6: Report Presets
- **Steps:**
  1. Click "Monthly Report" preset
  2. Generate report
- **Expected:** Report generated for entire current month
- **Validation:** Date range auto-populated correctly

---

## 🚀 Implementation Tasks

### Task 1: Setup Report Generation Libraries
- [ ] Install PDFKit or jsPDF for PDF generation
- [ ] Install ExcelJS for Excel generation
- [ ] Install table formatting libraries
- [ ] Create document generation utilities
- [ ] Set up file download middleware
- **Estimated:** 2 hours

### Task 2: Backend Report Generation
- [ ] Create PDF generation function
- [ ] Create Excel generation function
- [ ] Implement date range filtering
- [ ] Implement category filtering
- [ ] Add Thai formatting (date, currency)
- [ ] Implement pagination for large reports
- [ ] Add error handling and validation
- [ ] Write unit tests
- **Estimated:** 6 hours

### Task 3: Report Endpoints & API
- [ ] Create GET /api/reports/transactions endpoint
- [ ] Create POST /api/reports/generate-pdf endpoint
- [ ] Create POST /api/reports/generate-excel endpoint
- [ ] Create GET /api/reports/presets endpoint
- [ ] Implement parameter validation
- [ ] Add authentication/authorization
- [ ] Test with Postman/Thunder Client
- **Estimated:** 3 hours

### Task 4: Frontend Report UI
- [ ] Build report generator page/modal
- [ ] Create date range picker
- [ ] Create filter components (category, type)
- [ ] Create preset buttons
- [ ] Implement download functionality
- [ ] Add loading/progress indicators
- [ ] Add error message display
- [ ] Mobile responsive design
- **Estimated:** 4 hours

### Task 5: Integration & Testing
- [ ] End-to-end testing of PDF generation
- [ ] End-to-end testing of Excel generation
- [ ] Test with various date ranges
- [ ] Test Thai formatting
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Accessibility testing
- **Estimated:** 3 hours

### Task 6: Documentation
- [ ] API documentation for report endpoints
- [ ] Component documentation
- [ ] User guide for report generation
- [ ] Report format specifications
- [ ] Troubleshooting guide
- **Estimated:** 2 hours

---

## 🔗 Dependencies

### Required Before This
- ✅ User authentication (completed)
- Story 002: Transaction Management (needs transaction data)
- Story 003: Category Management (needs categories for filtering)
- Story 004: Date Validation (needs valid dates)

### Blocks These Stories
- Story 006: Advanced Search (may use similar filtering)

### Related Stories
- Story 001: Dashboard (uses similar data aggregation)
- Story 002: Transaction Management (uses transaction data)

---

## 📊 Report Examples

### PDF Report Summary
```
╔════════════════════════════════════╗
║    วัดพระเจ้าสมญา                 ║
║    รายงานการเงิน                  ║
║    ประจำเดือน พฤศจิกายน 2568      ║
╚════════════════════════════════════╝

รายรับทั้งหมด        ฿ 45,000.00
รายจ่ายทั้งหมด       ฿ 32,000.00
ยอดคงเหลือ          ฿ 13,000.00
```

### Excel Sheet: Category Breakdown
```
| Category           | Count | Amount     | % of Total |
|-----------------|-------|------------|-----------|
| บริจาค             | 25    | 45,000.00  | 100%      |
| สาธารณูปโภค        | 12    | 5,000.00   | 11.1%     |
| ซ่อมแซม            | 8     | 3,500.00   | 7.8%      |
| อาหาร              | 15    | 8,200.00   | 18.2%     |
| กิจกรรม            | 10    | 7,800.00   | 17.3%     |
| การศึกษา          | 5     | 2,500.00   | 5.6%      |
```

---

## ⏱️ Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Setup Libraries | 2 hours | ⏳ Pending |
| Backend Implementation | 6 hours | ⏳ Pending |
| API Endpoints | 3 hours | ⏳ Pending |
| Frontend UI | 4 hours | ⏳ Pending |
| Integration & Testing | 3 hours | ⏳ Pending |
| Documentation | 2 hours | ⏳ Pending |
| **Total** | **20 hours** | |

---

## ✨ Success Metrics

- ✅ PDF reports generate correctly with proper formatting
- ✅ Excel reports have multiple sheets with correct data
- ✅ Thai date and currency formatting perfect
- ✅ Reports generate < 5 seconds for typical volumes
- ✅ All filters working correctly
- ✅ Download functionality reliable
- ✅ 100% test coverage for report generation
- ✅ User satisfaction rating 4/5 or higher

---

**Story Created:** November 9, 2025
**Last Updated:** November 9, 2025
**Created By:** Claude Code (BMAD Workflow System)
