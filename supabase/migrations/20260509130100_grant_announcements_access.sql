-- Grant public read access to announcements for the anon role
-- Required for the landing page to fetch announcements without authentication

GRANT SELECT ON announcements TO anon;
GRANT SELECT ON announcements TO authenticated;
