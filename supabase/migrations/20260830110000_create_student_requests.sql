-- ============================================================================
-- Migration: Create student_requests table (Online Student Service Requests)
-- Description: Supports Leave of Absence, Makeup Class, Class Transfer, Deferral
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.student_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    request_type VARCHAR(50) NOT NULL, -- 'leave_absence', 'makeup_class', 'class_transfer', 'deferral'
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    target_class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    request_date DATE,
    end_date DATE,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'cancelled'
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewer_note TEXT,
    reviewed_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_student_requests_student_id ON public.student_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_student_requests_parent_id ON public.student_requests(parent_id);
CREATE INDEX IF NOT EXISTS idx_student_requests_class_id ON public.student_requests(class_id);
CREATE INDEX IF NOT EXISTS idx_student_requests_status ON public.student_requests(status);
CREATE INDEX IF NOT EXISTS idx_student_requests_created_at ON public.student_requests(created_at DESC);

-- Enable RLS
ALTER TABLE public.student_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- 1. Admins / Teachers can view requests for their classes or all
CREATE POLICY "Admins and teachers can view student requests"
    ON public.student_requests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'staff', 'teacher')
        )
        OR student_id = auth.uid()
        OR parent_id = auth.uid()
    );

-- 2. Students & Parents can insert requests
CREATE POLICY "Students and parents can create requests"
    ON public.student_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid()
        OR parent_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'staff')
        )
    );

-- 3. Reviewers (Admins, Teachers) can update requests
CREATE POLICY "Authorized staff can review requests"
    ON public.student_requests
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'super_admin', 'staff', 'teacher')
        )
        OR (student_id = auth.uid() AND status = 'pending')
        OR (parent_id = auth.uid() AND status = 'pending')
    );
