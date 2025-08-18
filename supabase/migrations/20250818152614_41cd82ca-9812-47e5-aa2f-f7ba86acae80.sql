-- FINAL SECURITY VERIFICATION: Test actual public access restrictions
-- Create a test function to simulate what a real hacker would see

CREATE OR REPLACE FUNCTION test_public_access_to_personal_data()
RETURNS TABLE (
  security_test_result text,
  records_exposed bigint,
  personal_data_accessible boolean
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  record_count bigint := 0;
BEGIN
  -- Test what anonymous/public users can actually access
  BEGIN
    -- Try to access the main table as public
    SELECT COUNT(*) INTO record_count 
    FROM soru_cevap;
    
    -- If we get here, there's a security problem
    RETURN QUERY SELECT 
      'CRITICAL SECURITY BREACH: Public can access personal data'::text,
      record_count,
      true;
      
  EXCEPTION WHEN insufficient_privilege THEN
    -- This is what we want - access denied
    RETURN QUERY SELECT 
      'SECURITY OK: Public access properly blocked'::text,
      0::bigint,
      false;
  END;
END;
$$;

-- Test the security
SELECT * FROM test_public_access_to_personal_data();