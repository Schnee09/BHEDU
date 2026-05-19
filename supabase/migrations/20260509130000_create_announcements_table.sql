-- Public Announcements Table
-- For center-wide notices visible on the landing page without authentication

CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'event', 'holiday', 'urgent')),
    is_published BOOLEAN DEFAULT true,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_announcements_published ON announcements(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_expires ON announcements(expires_at);

-- Enable RLS
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Public read access for published, non-expired announcements
CREATE POLICY "Anyone can view published announcements"
    ON announcements FOR SELECT
    USING (
        is_published = true
        AND (expires_at IS NULL OR expires_at > NOW())
    );

-- Only admin/staff can manage announcements
CREATE POLICY "Admin can manage announcements"
    ON announcements FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid()
            AND p.role IN ('admin', 'staff')
        )
    );
