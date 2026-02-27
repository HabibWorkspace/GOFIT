-- Fix empty string dates in member_profiles table
UPDATE member_profiles 
SET date_of_birth = NULL 
WHERE date_of_birth = '';

UPDATE member_profiles 
SET admission_date = NULL 
WHERE admission_date = '';

UPDATE member_profiles 
SET package_start_date = NULL 
WHERE package_start_date = '';

UPDATE member_profiles 
SET package_expiry_date = NULL 
WHERE package_expiry_date = '';

-- Fix empty string dates in transactions table
UPDATE transactions 
SET due_date = NULL 
WHERE due_date = '';

UPDATE transactions 
SET paid_date = NULL 
WHERE paid_date = '';

-- Verify the changes
SELECT 'member_profiles with empty dates' as check_type, COUNT(*) as count 
FROM member_profiles 
WHERE date_of_birth = '' OR admission_date = '' OR package_start_date = '' OR package_expiry_date = '';

SELECT 'transactions with empty dates' as check_type, COUNT(*) as count 
FROM transactions 
WHERE due_date = '' OR paid_date = '';
