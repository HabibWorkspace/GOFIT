-- Run this SQL directly in Render's PostgreSQL console to make CNIC and email optional

-- Make CNIC and email nullable
ALTER TABLE member_profiles ALTER COLUMN cnic DROP NOT NULL;
ALTER TABLE member_profiles ALTER COLUMN email DROP NOT NULL;

-- Drop unique indexes
DROP INDEX IF EXISTS ix_member_profiles_cnic;
DROP INDEX IF EXISTS ix_member_profiles_email;

-- Recreate as non-unique indexes
CREATE INDEX IF NOT EXISTS ix_member_profiles_cnic ON member_profiles(cnic);
CREATE INDEX IF NOT EXISTS ix_member_profiles_email ON member_profiles(email);

-- Verify the changes
SELECT column_name, is_nullable, data_type 
FROM information_schema.columns 
WHERE table_name = 'member_profiles' 
AND column_name IN ('cnic', 'email');
