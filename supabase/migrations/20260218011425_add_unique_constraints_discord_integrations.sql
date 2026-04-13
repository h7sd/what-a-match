/*
  # Add unique constraints to discord_integrations

  ## Problem
  The discord_integrations table only has a primary key on `id`.
  The upsert with `onConflict: 'user_id'` fails because there is
  no UNIQUE constraint on `user_id` or `discord_id`.

  ## Changes
  - Add UNIQUE constraint on `user_id` (one Discord per user)
  - Add UNIQUE constraint on `discord_id` (one user per Discord account)

  ## Notes
  If duplicate rows exist they must be resolved first - this migration
  keeps the most-recently updated row per user_id / discord_id.
*/

-- Remove duplicate user_id rows (keep most recent)
DELETE FROM discord_integrations
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM discord_integrations
  ORDER BY user_id, updated_at DESC NULLS LAST
);

-- Remove duplicate discord_id rows (keep most recent)
DELETE FROM discord_integrations
WHERE id NOT IN (
  SELECT DISTINCT ON (discord_id) id
  FROM discord_integrations
  ORDER BY discord_id, updated_at DESC NULLS LAST
);

-- Add unique constraints
ALTER TABLE discord_integrations
  ADD CONSTRAINT discord_integrations_user_id_key UNIQUE (user_id);

ALTER TABLE discord_integrations
  ADD CONSTRAINT discord_integrations_discord_id_key UNIQUE (discord_id);
