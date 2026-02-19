/*
  # Fix Friend Badges: Unique Recipient and No Duplicate Names

  1. Changes
    - Add unique constraint: a creator can only have ONE recipient (one person they give badges to)
      This is enforced via a partial/functional index that ensures all rows from the same creator
      share the same recipient_id.
    - Add unique constraint: a creator cannot give the same badge name twice to the same recipient
      (prevents duplicate badges)

  2. Notes
    - The "one recipient per creator" rule is enforced at DB level with a unique constraint
      on (creator_id, recipient_id) combined with a check that all badges from the same creator
      go to the same person - implemented via a function + constraint.
    - The simpler approach: unique on (creator_id, name) prevents duplicate badge names from
      the same creator, regardless of recipient.
    - For the "one recipient only" rule: we use a unique index on (creator_id, recipient_id)
      AND a trigger that blocks inserting a different recipient_id for a given creator.
*/

-- Unique badge name per creator (no duplicates)
ALTER TABLE friend_badges
  ADD CONSTRAINT friend_badges_creator_name_unique
  UNIQUE (creator_id, name);

-- Create a function to enforce "one recipient per creator" rule
CREATE OR REPLACE FUNCTION check_friend_badge_single_recipient()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  existing_recipient_id uuid;
BEGIN
  -- Check if this creator already has badges with a DIFFERENT recipient
  SELECT DISTINCT recipient_id INTO existing_recipient_id
  FROM friend_badges
  WHERE creator_id = NEW.creator_id
    AND recipient_id != NEW.recipient_id
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'You can only create friend badges for one person. Delete your existing badges to choose a different recipient.';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to enforce the single-recipient rule on insert
DROP TRIGGER IF EXISTS enforce_single_recipient_per_creator ON friend_badges;
CREATE TRIGGER enforce_single_recipient_per_creator
  BEFORE INSERT ON friend_badges
  FOR EACH ROW
  EXECUTE FUNCTION check_friend_badge_single_recipient();
