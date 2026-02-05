-- Migration: Financial System Tables
-- Description: Create all financial management tables for invoices, payments, and student accounts
-- Version: 010
-- Date: 2025-12-09

-- ===== STUDENT ACCOUNTS =====
DROP TABLE IF EXISTS student_accounts CASCADE;

CREATE TABLE student_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_fees DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, academic_year_id)
);

CREATE INDEX idx_student_accounts_student_id ON student_accounts(student_id);
CREATE INDEX idx_student_accounts_academic_year_id ON student_accounts(academic_year_id);
CREATE INDEX idx_student_accounts_status ON student_accounts(status);

-- ===== FEE TYPES =====
DROP TABLE IF EXISTS fee_types CASCADE;

CREATE TABLE fee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'tuition' CHECK (category IN ('tuition', 'facility', 'activity', 'exam', 'other')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fee_types_active ON fee_types(is_active);
CREATE INDEX idx_fee_types_category ON fee_types(category);

-- ===== FEE ASSIGNMENTS =====
DROP TABLE IF EXISTS fee_assignments CASCADE;

CREATE TABLE fee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  fee_type_id UUID NOT NULL REFERENCES fee_types(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_fee_assignments_academic_year ON fee_assignments(academic_year_id);
CREATE INDEX idx_fee_assignments_fee_type ON fee_assignments(fee_type_id);
CREATE INDEX idx_fee_assignments_class ON fee_assignments(class_id);

-- ===== INVOICES =====
DROP TABLE IF EXISTS invoices CASCADE;

CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_account_id UUID REFERENCES student_accounts(id) ON DELETE SET NULL,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'partial', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_student_id ON invoices(student_id);
CREATE INDEX idx_invoices_academic_year ON invoices(academic_year_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- ===== INVOICE ITEMS =====
DROP TABLE IF EXISTS invoice_items CASCADE;

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  fee_type_id UUID REFERENCES fee_types(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INT DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_fee_type ON invoice_items(fee_type_id);

-- ===== PAYMENT METHODS =====
DROP TABLE IF EXISTS payment_methods CASCADE;

CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank_transfer', 'credit_card', 'cheque', 'digital_wallet', 'other')),
  description TEXT,
  requires_reference BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_methods_active ON payment_methods(is_active);

-- ===== PAYMENTS =====
DROP TABLE IF EXISTS payments CASCADE;

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES payment_methods(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  reference_number TEXT,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  received_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('pending', 'received', 'verified', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_payment_method ON payments(payment_method_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

-- ===== PAYMENT ALLOCATIONS =====
DROP TABLE IF EXISTS payment_allocations CASCADE;

CREATE TABLE payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON payment_allocations(invoice_id);

-- ===== PAYMENT SCHEDULES =====
DROP TABLE IF EXISTS payment_schedules CASCADE;

CREATE TABLE payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL DEFAULT 'installment' CHECK (schedule_type IN ('installment', 'milestone', 'custom')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payment_schedules_academic_year ON payment_schedules(academic_year_id);

-- ===== PAYMENT SCHEDULE INSTALLMENTS =====
DROP TABLE IF EXISTS payment_schedule_installments CASCADE;

CREATE TABLE payment_schedule_installments (
  id UUID DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  percentage DECIMAL(5, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (schedule_id, installment_number)
);

CREATE INDEX idx_schedule_installments_schedule ON payment_schedule_installments(schedule_id);

-- ===== ROW LEVEL SECURITY =====

-- Student Accounts: Students can view their own, admins can view all
ALTER TABLE student_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own account"
  ON student_accounts
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert/update accounts"
  ON student_accounts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fee Types: Public read, admins write
ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active fee types"
  ON fee_types
  FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

CREATE POLICY "Admins can manage fee types"
  ON fee_types
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Fee Assignments: Public read, admins write
ALTER TABLE fee_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fee assignments"
  ON fee_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage fee assignments"
  ON fee_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Invoices: Students see their own, admins see all
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Invoice Items: Inherit from invoice visibility
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items from invoices they can see"
  ON invoice_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.id = invoice_items.invoice_id
      AND (
        invoices.student_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Payment Methods: Public read
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment methods"
  ON payment_methods
  FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Payments: Students see their own, admins see all
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Payment Allocations: Inherit from payment/invoice visibility
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view allocations from payments they can see"
  ON payment_allocations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.id = payment_allocations.payment_id
      AND (
        payments.student_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'
        )
      )
    )
  );

-- Payment Schedules: Public read
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active payment schedules"
  ON payment_schedules
  FOR SELECT
  TO authenticated
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  ));

-- Payment Schedule Installments: Public read
ALTER TABLE payment_schedule_installments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view schedule installments"
  ON payment_schedule_installments
  FOR SELECT
  TO authenticated
  USING (true);

-- ===== TRIGGERS FOR UPDATED_AT =====

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER student_accounts_update_timestamp
  BEFORE UPDATE ON student_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER fee_types_update_timestamp
  BEFORE UPDATE ON fee_types
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER fee_assignments_update_timestamp
  BEFORE UPDATE ON fee_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER invoices_update_timestamp
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER payment_methods_update_timestamp
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER payments_update_timestamp
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER payment_schedules_update_timestamp
  BEFORE UPDATE ON payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- ===== COMMENTS FOR DOCUMENTATION =====

COMMENT ON TABLE student_accounts IS 'Tracks student financial account balances and status per academic year';
COMMENT ON TABLE fee_types IS 'Defines types of fees (tuition, facility, activity, exam, etc)';
COMMENT ON TABLE fee_assignments IS 'Assigns fees to classes for specific academic years';
COMMENT ON TABLE invoices IS 'Student invoices generated from fee assignments';
COMMENT ON TABLE invoice_items IS 'Line items on invoices detailing what fees are being charged';
COMMENT ON TABLE payment_methods IS 'Available payment methods (cash, bank transfer, card, etc)';
COMMENT ON TABLE payments IS 'Records of payments received from students';
COMMENT ON TABLE payment_allocations IS 'Tracks how payments are allocated to specific invoices';
COMMENT ON TABLE payment_schedules IS 'Defines installment or milestone payment schedules';
COMMENT ON TABLE payment_schedule_installments IS 'Individual installments in a payment schedule';
