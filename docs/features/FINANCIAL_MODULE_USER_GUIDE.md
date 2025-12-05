# Financial Module - User Guide

**BH-EDU School Management System**  
**Version:** 1.0  
**Last Updated:** November 19, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Access & Permissions](#access--permissions)
3. [Module Components](#module-components)
4. [Student Accounts](#student-accounts)
5. [Invoice Management](#invoice-management)
6. [Payment Processing](#payment-processing)
7. [Financial Reports](#financial-reports)
8. [Common Workflows](#common-workflows)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Financial Module is a comprehensive system for managing all financial aspects of the school, including:

- **Student Account Management** - Track balances for each student
- **Invoice Generation** - Create and manage itemized invoices
- **Payment Processing** - Record and allocate payments
- **Financial Reporting** - Analytics and insights into school finances

### Key Features

✅ **Real-time Balance Tracking** - Automatically calculate student balances  
✅ **Flexible Invoice Creation** - Multi-line items with fee type integration  
✅ **Smart Payment Allocation** - Auto-distribute payments across invoices  
✅ **Comprehensive Reporting** - Summary statistics, trends, and export options  
✅ **Multi-filter Search** - Quick access to specific records  
✅ **Audit Trail** - Track who received payments and when  

---

## Access & Permissions

### Required Role
- **Admin** - Full access to all financial features

### Navigation
Access the Financial Module from the sidebar under **Finance**:
- Student Accounts
- Invoices
- Payments
- Financial Reports

---

## Module Components

### 1. Student Accounts (`/dashboard/admin/finance/student-accounts`)

**Purpose:** Overview of all student financial accounts

**Features:**
- Summary statistics (Total Charges, Payments, Balances, Overdue Count)
- Multi-filter search (Student name, Academic year, Status, Balance range)
- Real-time balance calculations
- Direct links to student details and invoices

**Data Displayed:**
| Column | Description |
|--------|-------------|
| Student ID | Unique student identifier |
| Student Name | Full name with clickable link to account details |
| Academic Year | Current academic year for the account |
| Total Charges | Sum of all invoice amounts |
| Total Payments | Sum of all payments received |
| Balance | Outstanding amount (Charges - Payments) |
| Status | Account status (Active/Inactive/Suspended) |

---

### 2. Invoices (`/dashboard/admin/finance/invoices`)

**Purpose:** Create and manage student invoices

**Features:**
- Invoice listing with advanced filters
- Create new invoices with multiple line items
- Fee type integration (auto-fill prices)
- Status management (Draft → Issued → Paid)
- View invoice details with payment history

**Invoice Statuses:**
- **Draft** - Not yet issued (editable)
- **Issued** - Sent to student/parent (payment pending)
- **Paid** - Fully paid (balance = 0)
- **Overdue** - Past due date with outstanding balance
- **Cancelled** - Voided invoice

---

### 3. Payments (`/dashboard/admin/finance/payments`)

**Purpose:** Record and manage payment receipts

**Features:**
- Payment recording with full details
- Auto-fetch unpaid invoices for selected student
- Smart allocation algorithm (distributes payment optimally)
- Manual allocation adjustment
- Payment history with allocation breakdown
- Multiple payment methods support

**Payment Information Captured:**
- Payment date
- Amount received
- Payment method (Cash, Check, Credit Card, Bank Transfer, etc.)
- Reference number (check #, transaction ID, etc.)
- Received by (staff member name)
- Notes (optional)

---

### 4. Financial Reports (`/dashboard/admin/finance/reports`)

**Purpose:** Analytics and insights into school finances

**Report Sections:**

#### A. Summary Statistics
- Total Revenue (all-time or filtered)
- Outstanding Balances
- Number of Invoices
- Collection Rate (Payments ÷ Charges × 100)

#### B. Revenue by Category
Breakdown by fee type categories:
- Tuition Fees
- Admission Fees
- Miscellaneous Fees
- Lab Fees
- Library Fees
- Sports Fees
- etc.

#### C. By Grade Level
Financial summary per grade:
- Total charges per grade
- Total payments per grade
- Outstanding balances per grade

#### D. Payment Methods
Analysis of payment methods used:
- Count of transactions per method
- Total amount per method

#### E. Top Debtors
List of students with highest outstanding balances

#### F. Monthly Trends
Month-by-month comparison of:
- Invoices issued
- Payments received

**Export Options:**
- CSV export of all report data
- Filterable by academic year and date range

---

## Student Accounts

### Viewing All Accounts

1. Navigate to **Finance → Student Accounts**
2. View summary statistics at the top
3. Use filters to narrow down results:
   - **Search** - Student name or ID
   - **Academic Year** - Specific year
   - **Status** - Active/Inactive/Suspended
   - **Balance** - All/Outstanding Only/Paid Up

### Viewing Account Details

1. Click on a student's name in the accounts list
2. View comprehensive account details:
   - **Financial Summary** - Charges, Payments, Balance
   - **Recent Activity** - Latest invoices and payments
   - **All Invoices** - Complete invoice history
   - **All Payments** - Complete payment history

3. Use quick actions:
   - **Create Invoice** - Generate new invoice for student
   - **Record Payment** - Record payment from student
   - **View Student Profile** - Navigate to student details

---

## Invoice Management

### Creating an Invoice

1. Navigate to **Finance → Invoices**
2. Click **Create Invoice** button
3. Fill in invoice details:
   - **Student** - Select from dropdown
   - **Academic Year** - Select year
   - **Issue Date** - Date invoice is created
   - **Due Date** - Payment deadline
   - **Status** - Draft or Issued

4. Add line items:
   - Click **Add Item** button
   - Select **Fee Type** (auto-fills description and price)
   - Adjust **Quantity** if needed
   - Modify **Unit Price** if necessary
   - System calculates **Amount** automatically

5. Add multiple items as needed (click **Remove** to delete an item)
6. Verify **Total Amount** calculation
7. Add **Notes** (optional)
8. Click **Create Invoice**

### Viewing Invoice Details

1. Click **View** on any invoice in the list
2. Review invoice details:
   - Student information
   - Invoice number and dates
   - Line items with amounts
   - Payment history (if any)
   - Payment summary (Total, Paid, Balance)

### Invoice Actions

**From Invoice Details Page:**
- **Record Payment** - Link to payment page with pre-filled student
- **Issue Invoice** - Change status from Draft to Issued
- **Cancel Invoice** - Mark invoice as cancelled
- **View Student Account** - Navigate to student's financial account
- **Delete Invoice** - Remove invoice (confirmation required)
- **Print** - Browser print function

---

## Payment Processing

### Recording a Payment

1. Navigate to **Finance → Payments**
2. Click **Record Payment** button
3. Fill in payment details:
   - **Student** - Select student (auto-loads unpaid invoices)
   - **Payment Date** - Date payment received
   - **Amount** - Total amount received
   - **Payment Method** - Select from dropdown
   - **Reference Number** - Check #, transaction ID, etc. (optional)
   - **Notes** - Additional information (optional)

4. **Allocation Section:**
   - System auto-loads all unpaid invoices for selected student
   - **Auto-Allocate** button distributes payment optimally
   - Or manually enter amount for each invoice
   - View **Unallocated Amount** (should be $0.00 before saving)

5. Click **Record Payment**

### Smart Auto-Allocation

The auto-allocation algorithm:
1. Sorts invoices by due date (oldest first)
2. Allocates full payment to invoices sequentially
3. Stops when payment amount is fully distributed

**Example:**
- Payment received: $1,500
- Invoice #1 (due Jan 15): $1,000 → Allocates $1,000
- Invoice #2 (due Feb 15): $800 → Allocates $500 (remaining)
- Unallocated: $0

### Viewing Payment History

From the Payments page:
- View all payments with filters (Student, Method, Date Range)
- See payment details including allocations
- Click on student name to view account details

---

## Financial Reports

### Generating Reports

1. Navigate to **Finance → Financial Reports**
2. Apply filters:
   - **Academic Year** - Select specific year
   - **Start Date** - Beginning of date range (optional)
   - **End Date** - End of date range (optional)
3. Click **Generate Report**

### Understanding Report Metrics

**Collection Rate:**
- Formula: (Total Payments ÷ Total Charges) × 100
- Indicates what percentage of charges has been collected
- 100% = All charges paid
- Below 100% = Outstanding balances remain

**Revenue Categories:**
- Shows breakdown by fee type
- Helps identify main revenue sources

**Grade Level Analysis:**
- Compare financial performance across grades
- Identify grades with highest balances

**Monthly Trends:**
- Compare invoices issued vs payments received
- Identify seasonal patterns

### Exporting Data

1. Generate report with desired filters
2. Click **Export to CSV** button
3. Save file to your computer
4. Open in Excel or Google Sheets for further analysis

---

## Common Workflows

### Workflow 1: New Student Enrollment

1. Student enrolls (done in Students module)
2. Create first invoice:
   - Go to **Finance → Invoices → Create Invoice**
   - Select student and academic year
   - Add admission fee line item
   - Add tuition fee line item
   - Set due date (e.g., 30 days from enrollment)
   - Save as **Issued** status
3. Student account is automatically created

### Workflow 2: Tuition Payment Received

1. Go to **Finance → Payments → Record Payment**
2. Select student (invoices auto-load)
3. Enter payment amount and method
4. Click **Auto-Allocate** (or manually allocate)
5. Add reference number if applicable
6. Click **Record Payment**
7. System updates:
   - Invoice paid amounts
   - Invoice balances
   - Student account balance
   - Payment history

### Workflow 3: Monthly Financial Review

1. Go to **Finance → Financial Reports**
2. Select current academic year
3. Set date range to current month
4. Review:
   - Collection rate (target: >90%)
   - Top debtors (follow up on high balances)
   - Payment methods (ensure diversity)
   - Monthly trends (compare to previous months)
5. Export data for board meeting

### Workflow 4: Follow-up on Overdue Invoices

1. Go to **Finance → Invoices**
2. Filter by **Status: Overdue**
3. Review list of overdue invoices
4. For each:
   - Click **View** to see details
   - Note amount overdue and days past due
   - Use student email/phone to contact
   - Document follow-up in invoice notes
5. Monitor until payment received

### Workflow 5: Academic Year Rollover

1. Generate final report for closing year
2. Export all data to CSV (backup)
3. Create invoices for new academic year:
   - Select new academic year in invoice creation
   - System maintains separate accounts per year
4. Review outstanding balances from previous year
5. Create carry-forward invoices if needed

---

## Best Practices

### Invoice Management

✅ **Use Fee Types** - Standardizes pricing and descriptions  
✅ **Issue Invoices Promptly** - Send within 24 hours of student enrollment  
✅ **Set Realistic Due Dates** - Consider payment schedules (monthly, quarterly)  
✅ **Include Notes** - Document special arrangements or payment plans  
✅ **Keep Draft Status Brief** - Issue invoices quickly after creation  

### Payment Processing

✅ **Record Same Day** - Enter payments on the day received  
✅ **Always Get Reference Numbers** - For checks, transactions, receipts  
✅ **Use Auto-Allocate** - Faster and reduces errors  
✅ **Verify Unallocated = $0** - Before saving payment  
✅ **Print Receipts** - Provide to students/parents immediately  

### Reporting

✅ **Monthly Reviews** - Generate reports at least monthly  
✅ **Track Collection Rate** - Set targets and monitor progress  
✅ **Follow Up Quickly** - Contact students with overdue balances within 7 days  
✅ **Export Regularly** - Keep CSV backups of financial data  
✅ **Compare Trends** - Year-over-year and month-over-month analysis  

### Data Quality

✅ **Consistent Naming** - Use standard fee type names  
✅ **Accurate Dates** - Double-check issue and due dates  
✅ **Complete Information** - Fill all required fields  
✅ **Regular Audits** - Review accounts quarterly for errors  
✅ **Reconciliation** - Match system totals with bank deposits  

---

## Troubleshooting

### Issue: Student Account Not Showing

**Cause:** No invoice has been created for the student  
**Solution:** Create first invoice to initialize account

### Issue: Payment Not Allocating Correctly

**Cause:** Manual allocation amounts exceed payment amount  
**Solution:** 
1. Check unallocated amount (should be ≥ $0)
2. Click **Auto-Allocate** to reset
3. Adjust amounts manually if needed

### Issue: Invoice Status Not Changing to Paid

**Cause:** Invoice balance > $0  
**Solution:** 
1. View invoice details
2. Check payment history
3. Record additional payment if needed
4. System auto-updates status when balance = $0

### Issue: Reports Showing Incorrect Totals

**Cause:** Filters or date range too restrictive  
**Solution:**
1. Clear all filters
2. Select "All" for academic year
3. Remove start/end dates
4. Regenerate report

### Issue: Cannot Delete Invoice

**Cause:** Invoice has payment allocations  
**Solution:**
1. Go to **Payments** page
2. Find payments allocated to this invoice
3. Delete those payments first (if appropriate)
4. Then delete invoice
5. **Recommendation:** Cancel instead of deleting

### Issue: Duplicate Payment Recorded

**Cause:** Double-clicked submit button  
**Solution:**
1. Go to **Payments** page
2. Filter by student and date
3. Identify duplicate payment
4. Contact administrator to delete duplicate

### Issue: Student Balance Incorrect

**Cause:** Missing invoice or payment  
**Solution:**
1. View student account details
2. Review all invoices (check totals)
3. Review all payments (check totals)
4. Manually calculate: Charges - Payments
5. If discrepancy persists, contact support

---

## Feature Highlights

### 🎯 Smart Payment Allocation
Automatically distributes payments across multiple invoices based on due dates, saving time and reducing manual errors.

### 📊 Real-time Statistics
All summary cards and totals update automatically as you create invoices and record payments.

### 🔍 Advanced Filtering
Multi-criteria filtering on all pages helps you find exactly what you need in seconds.

### 📱 Responsive Design
Works seamlessly on desktop, tablet, and mobile devices.

### 🖨️ Print Support
Invoice details pages include print-friendly layouts for physical receipts.

### 💾 CSV Export
Export financial data to CSV format for Excel analysis or external reporting.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Print Invoice | `Ctrl + P` (on invoice details page) |
| Search | Focus on search box (varies by page) |
| Close Modal | `Esc` |

---

## Data Dictionary

### Invoice Statuses
- **draft** - Not yet issued to student
- **issued** - Sent to student, awaiting payment
- **paid** - Fully paid (balance = 0)
- **overdue** - Past due date with balance > 0
- **cancelled** - Voided, not collectible

### Account Statuses
- **active** - Normal account, can transact
- **inactive** - Student no longer enrolled
- **suspended** - Account on hold (e.g., payment issues)

### Fee Categories
- Tuition Fees
- Admission Fees
- Miscellaneous Fees
- Lab Fees
- Library Fees
- Sports Fees
- Transportation Fees
- Uniform Fees
- Exam Fees

---

## Support & Contact

For technical support or questions about the Financial Module:

📧 **Email:** support@bh-edu.com  
📞 **Phone:** (123) 456-7890  
🌐 **Help Center:** https://help.bh-edu.com/finance

**Office Hours:** Monday - Friday, 8:00 AM - 5:00 PM

---

## Changelog

### Version 1.0 (November 19, 2025)
- ✨ Initial release of Financial Module
- ✅ Student Accounts page
- ✅ Invoice Management with multi-line items
- ✅ Payment Processing with auto-allocation
- ✅ Financial Reports with analytics
- ✅ Student Account Details page
- ✅ Invoice Details page with payment history

---

## Appendix: Formula Reference

### Balance Calculation
```
Balance = Total Charges - Total Payments
```

### Collection Rate
```
Collection Rate = (Total Payments ÷ Total Charges) × 100
```

### Invoice Balance
```
Invoice Balance = Total Amount - Paid Amount
```

### Payment Allocation
```
Unallocated Amount = Payment Amount - Sum of Allocations
```

### Account Total Charges
```
Total Charges = Sum of all invoice amounts for student
```

### Account Total Payments
```
Total Payments = Sum of all payment amounts for student
```

---

**End of User Guide**

For the latest documentation and updates, visit: https://docs.bh-edu.com/finance
