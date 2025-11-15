-- Financial Management System Migration
-- Handles fee management, student accounts, invoicing, and payments

-- ============================================================================
-- Fee Types and Management
-- ============================================================================

-- Fee types (tuition, registration, books, uniform, etc.)
CREATE TABLE IF NOT EXISTS fee_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  category VARCHAR(100), -- tuition, registration, books, uniform, transport, misc
  is_mandatory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_fee_type_per_year UNIQUE (name, academic_year_id)
);

-- Payment schedules (when fees are due)
CREATE TABLE IF NOT EXISTS payment_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
  schedule_type VARCHAR(50) NOT NULL DEFAULT 'installment', -- one-time, installment, recurring
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment schedule installments
CREATE TABLE IF NOT EXISTS payment_schedule_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES payment_schedules(id) ON DELETE CASCADE,
  installment_number INT NOT NULL,
  due_date DATE NOT NULL,
  percentage DECIMAL(5, 2) CHECK (percentage > 0 AND percentage <= 100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_installment UNIQUE (schedule_id, installment_number)
);

-- Fee assignments to grade levels or specific students
CREATE TABLE IF NOT EXISTS fee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fee_type_id UUID NOT NULL REFERENCES fee_types(id) ON DELETE CASCADE,
  assignment_type VARCHAR(50) NOT NULL, -- grade_level, student, all
  grade_level VARCHAR(50), -- only if assignment_type = grade_level
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- only if assignment_type = student
  payment_schedule_id UUID REFERENCES payment_schedules(id) ON DELETE SET NULL,
  amount_override DECIMAL(10, 2) CHECK (amount_override >= 0), -- custom amount if different from fee type
  discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- Student Accounts and Invoicing
-- ============================================================================

-- Student financial accounts (balance tracking)
CREATE TABLE IF NOT EXISTS student_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  total_fees DECIMAL(10, 2) DEFAULT 0 CHECK (total_fees >= 0),
  total_paid DECIMAL(10, 2) DEFAULT 0 CHECK (total_paid >= 0),
  balance DECIMAL(10, 2) GENERATED ALWAYS AS (total_fees - total_paid) STORED,
  status VARCHAR(50) DEFAULT 'pending', -- pending, partial, paid, overdue
  last_payment_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT unique_student_account UNIQUE (student_id, academic_year_id)
);

-- Invoices for students
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_account_id UUID REFERENCES student_accounts(id) ON DELETE SET NULL,
  academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL CHECK (total_amount >= 0),
  paid_amount DECIMAL(10, 2) DEFAULT 0 CHECK (paid_amount >= 0),
  balance DECIMAL(10, 2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status VARCHAR(50) DEFAULT 'unpaid', -- unpaid, partial, paid, overdue, cancelled
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Invoice line items (breakdown of fees)
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  fee_type_id UUID REFERENCES fee_types(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity INT DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  discount_percentage DECIMAL(5, 2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- Payment Processing
-- ============================================================================

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL, -- cash, bank_transfer, cheque, mobile_money, card, online
  is_active BOOLEAN DEFAULT true,
  requires_reference BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(50) NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_account_id UUID REFERENCES student_accounts(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  transaction_reference VARCHAR(255),
  notes TEXT,
  received_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Payment allocations (how payment is distributed across invoices)
CREATE TABLE IF NOT EXISTS payment_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_fee_types_academic_year ON fee_types(academic_year_id);
CREATE INDEX idx_fee_types_category ON fee_types(category);
CREATE INDEX idx_fee_types_active ON fee_types(is_active);

CREATE INDEX idx_fee_assignments_type ON fee_assignments(assignment_type);
CREATE INDEX idx_fee_assignments_grade ON fee_assignments(grade_level);
CREATE INDEX idx_fee_assignments_student ON fee_assignments(student_id);
CREATE INDEX idx_fee_assignments_fee ON fee_assignments(fee_type_id);

CREATE INDEX idx_student_accounts_student ON student_accounts(student_id);
CREATE INDEX idx_student_accounts_year ON student_accounts(academic_year_id);
CREATE INDEX idx_student_accounts_status ON student_accounts(status);

CREATE INDEX idx_invoices_student ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_account ON invoices(student_account_id);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_fee_type ON invoice_items(fee_type_id);

CREATE INDEX idx_payments_student ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_method ON payments(payment_method_id);
CREATE INDEX idx_payments_account ON payments(student_account_id);

CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON payment_allocations(invoice_id);

-- ============================================================================
-- RLS Policies (allow admin full access, restrict student/parent to own data)
-- ============================================================================

ALTER TABLE fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedule_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_allocations ENABLE ROW LEVEL SECURITY;

-- Admin policies (full access)
CREATE POLICY "Admins can manage fee types" ON fee_types FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage payment schedules" ON payment_schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage schedule installments" ON payment_schedule_installments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage fee assignments" ON fee_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage student accounts" ON student_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage invoices" ON invoices FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage invoice items" ON invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage payment methods" ON payment_methods FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage payments" ON payments FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can manage payment allocations" ON payment_allocations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Student/Parent policies (view own data)
CREATE POLICY "Students can view their accounts" ON student_accounts FOR SELECT USING (
  student_id = auth.uid()
);

CREATE POLICY "Students can view their invoices" ON invoices FOR SELECT USING (
  student_id = auth.uid()
);

CREATE POLICY "Students can view their invoice items" ON invoice_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.student_id = auth.uid())
);

CREATE POLICY "Students can view their payments" ON payments FOR SELECT USING (
  student_id = auth.uid()
);

CREATE POLICY "Everyone can view active payment methods" ON payment_methods FOR SELECT USING (is_active = true);

CREATE POLICY "Everyone can view active fee types" ON fee_types FOR SELECT USING (is_active = true);

-- ============================================================================
-- Triggers for automatic updates
-- ============================================================================

-- Update student account balances when invoice is created/updated
CREATE OR REPLACE FUNCTION update_student_account_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE student_accounts
    SET 
      total_fees = (
        SELECT COALESCE(SUM(total_amount), 0)
        FROM invoices
        WHERE student_account_id = NEW.student_account_id AND status != 'cancelled'
      ),
      total_paid = (
        SELECT COALESCE(SUM(paid_amount), 0)
        FROM invoices
        WHERE student_account_id = NEW.student_account_id AND status != 'cancelled'
      ),
      updated_at = now()
    WHERE id = NEW.student_account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_account_on_invoice
AFTER INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_student_account_totals();

-- Update invoice status based on paid amount
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.paid_amount >= NEW.total_amount THEN
    NEW.status := 'paid';
  ELSIF NEW.paid_amount > 0 THEN
    NEW.status := 'partial';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.paid_amount = 0 THEN
    NEW.status := 'overdue';
  ELSE
    NEW.status := 'unpaid';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invoice_status
BEFORE INSERT OR UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoice_status();

-- Update invoice paid amount when payment allocation changes
CREATE OR REPLACE FUNCTION update_invoice_paid_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE invoices
    SET 
      paid_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payment_allocations
        WHERE invoice_id = NEW.invoice_id
      ),
      updated_at = now()
    WHERE id = NEW.invoice_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE invoices
    SET 
      paid_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM payment_allocations
        WHERE invoice_id = OLD.invoice_id
      ),
      updated_at = now()
    WHERE id = OLD.invoice_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoice_paid
AFTER INSERT OR UPDATE OR DELETE ON payment_allocations
FOR EACH ROW
EXECUTE FUNCTION update_invoice_paid_amount();

-- Update student account last payment date
CREATE OR REPLACE FUNCTION update_last_payment_date()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE student_accounts
    SET 
      last_payment_date = NEW.payment_date,
      updated_at = now()
    WHERE id = NEW.student_account_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_last_payment_date
AFTER INSERT ON payments
FOR EACH ROW
EXECUTE FUNCTION update_last_payment_date();

-- Update student account status based on balance
CREATE OR REPLACE FUNCTION update_student_account_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.balance = 0 THEN
    NEW.status := 'paid';
  ELSIF NEW.total_paid > 0 THEN
    NEW.status := 'partial';
  ELSE
    -- Check if any invoice is overdue
    IF EXISTS (
      SELECT 1 FROM invoices 
      WHERE student_account_id = NEW.id 
      AND status = 'overdue'
    ) THEN
      NEW.status := 'overdue';
    ELSE
      NEW.status := 'pending';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_account_status
BEFORE UPDATE ON student_accounts
FOR EACH ROW
EXECUTE FUNCTION update_student_account_status();

-- ============================================================================
-- Insert default payment methods
-- ============================================================================

INSERT INTO payment_methods (name, type, requires_reference, description) VALUES
  ('Cash', 'cash', false, 'Cash payment at school office'),
  ('Bank Transfer', 'bank_transfer', true, 'Direct bank transfer'),
  ('Cheque', 'cheque', true, 'Cheque payment'),
  ('Mobile Money', 'mobile_money', true, 'Mobile money payment (MTN, Airtel, etc.)'),
  ('Credit/Debit Card', 'card', true, 'Card payment'),
  ('Online Payment', 'online', true, 'Online payment gateway')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- Helpful Views for Financial Reporting
-- ============================================================================

-- Outstanding balances by student
CREATE OR REPLACE VIEW outstanding_balances AS
SELECT 
  sa.id as account_id,
  p.id as student_id,
  p.full_name as student_name,
  ay.name as academic_year,
  sa.total_fees,
  sa.total_paid,
  sa.balance,
  sa.status,
  sa.last_payment_date
FROM student_accounts sa
JOIN profiles p ON sa.student_id = p.id
LEFT JOIN academic_years ay ON sa.academic_year_id = ay.id
WHERE sa.balance > 0
ORDER BY sa.balance DESC;

-- Payment summary by period
CREATE OR REPLACE VIEW payment_summary AS
SELECT 
  DATE_TRUNC('month', payment_date) as month,
  pm.name as payment_method,
  COUNT(*) as transaction_count,
  SUM(amount) as total_amount
FROM payments p
JOIN payment_methods pm ON p.payment_method_id = pm.id
GROUP BY DATE_TRUNC('month', payment_date), pm.name
ORDER BY month DESC, total_amount DESC;

-- Revenue by fee category
CREATE OR REPLACE VIEW revenue_by_category AS
SELECT 
  ft.category,
  ft.name as fee_name,
  COUNT(DISTINCT ii.invoice_id) as invoice_count,
  SUM(ii.amount) as total_revenue
FROM invoice_items ii
JOIN fee_types ft ON ii.fee_type_id = ft.id
JOIN invoices i ON ii.invoice_id = i.id
WHERE i.status != 'cancelled'
GROUP BY ft.category, ft.name
ORDER BY total_revenue DESC;

COMMENT ON TABLE fee_types IS 'Defines types of fees that can be charged';
COMMENT ON TABLE payment_schedules IS 'Payment schedule templates for fee payments';
COMMENT ON TABLE student_accounts IS 'Financial accounts for each student per academic year';
COMMENT ON TABLE invoices IS 'Invoices issued to students for fees';
COMMENT ON TABLE payments IS 'Payments received from students';
COMMENT ON TABLE payment_allocations IS 'Links payments to specific invoices';
