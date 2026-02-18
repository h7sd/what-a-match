/*
  # Reassign uid_numbers for recently registered users starting from 292

  ## Problem
  The last migration accidentally set the sequence starting point to 10000+
  because it picked up the max uid_number from seed/test data.
  Real users who registered recently got uid_numbers like 10080, 10081, 10082
  instead of continuing from the actual last real uid (291).

  ## Changes
  - Reassign the 3 real users with 10000+ uid_numbers to 292, 293, 294
    in order of their registration date
  - Reset the uid_number_seq sequence to 294 so future registrations continue correctly
  - Null-username profiles keep their existing numbers (they are seed/test data)
*/

-- Reassign real users with uid_number >= 10000 (excluding uservault which has special 10000 id)
-- ordered by created_at so the earliest gets the lowest number starting from 292
DO $$
DECLARE
  r RECORD;
  v_next int := 292;
BEGIN
  FOR r IN
    SELECT id FROM public.profiles
    WHERE uid_number >= 10000
      AND username IS NOT NULL
      AND username != 'uservault'
    ORDER BY created_at ASC
  LOOP
    UPDATE public.profiles SET uid_number = v_next WHERE id = r.id;
    v_next := v_next + 1;
  END LOOP;

  -- Reset sequence to continue after the last assigned number
  PERFORM setval('public.uid_number_seq', v_next - 1, true);
END $$;
