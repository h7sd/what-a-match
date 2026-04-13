/*
  # Secure Daily Rewards Policies
  
  1. Problem
    - daily_rewards hat public SELECT mit USING true
    - Jeder kann alle Daily Rewards aller User sehen
    - Das ist ein Privacy-Problem
  
  2. Änderungen
    - Public SELECT Policy löschen
    - Neue Policy: User können nur ihre eigenen Daily Rewards sehen
    - Service role kann weiterhin alles managen
  
  3. Sicherheit
    - User können nur ihre eigenen Daily Rewards sehen
    - Verhindert dass User die Rewards anderer User ausspähen
*/

-- Alte public SELECT policy löschen
DROP POLICY IF EXISTS "Anyone can view daily rewards" ON daily_rewards;

-- User können nur ihre eigenen Daily Rewards sehen
CREATE POLICY "Users can view their own daily rewards"
ON daily_rewards
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
