-- Create weekly_notes table for week-specific notes
CREATE TABLE IF NOT EXISTS weekly_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_id UUID NOT NULL REFERENCES timetable_slots(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(slot_id, week_start_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_weekly_notes_slot_week ON weekly_notes(slot_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_weekly_notes_week ON weekly_notes(week_start_date);

-- Enable RLS
ALTER TABLE weekly_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admin and staff can view all weekly notes"
    ON weekly_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Admin and staff can insert weekly notes"
    ON weekly_notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Admin and staff can update weekly notes"
    ON weekly_notes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

CREATE POLICY "Admin and staff can delete weekly notes"
    ON weekly_notes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'staff')
        )
    );

-- Teachers can view weekly notes for their slots
CREATE POLICY "Teachers can view their weekly notes"
    ON weekly_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM timetable_slots
            WHERE timetable_slots.id = weekly_notes.slot_id
            AND timetable_slots.teacher_id = auth.uid()
        )
    );
