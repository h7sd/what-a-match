
/*
  # Case-Exclusive Badges & Updated Case Items

  1. Removes all existing case_items for the 4 cases
  2. Inserts 12 new exclusive case-only global_badges with inline SVG icon_urls
     - Rarities: common, uncommon, rare, epic, legendary, mythic
  3. Populates case_items for each case with correct drop rates
     - Starter Case: premium badge is ultra-rare (0.1% chance)
     - Higher cases: better loot tables
*/

-- ─── Delete old case items ───────────────────────────────────────────────────
DELETE FROM case_items;

-- ─── Delete old case-exclusive badges (those created_by = 'case_system') ─────
DELETE FROM global_badges WHERE created_by = 'case_system';

-- ─── Insert new exclusive badges ─────────────────────────────────────────────

-- 1. COMMON: Coin Hoarder
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000001', 'Coin Hoarder', 'Earned from case openings', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28" fill="#c8a84b" stroke="#f5d76e" stroke-width="3"/>
  <circle cx="32" cy="32" r="20" fill="#f5d76e" opacity="0.3"/>
  <text x="32" y="38" text-anchor="middle" font-size="22" fill="#7a5c00" font-family="serif" font-weight="bold">$</text>
</svg>', '#f5d76e', 'common', false, 'case_system');

-- 2. COMMON: Lucky Clover
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000002', 'Lucky Clover', 'Fortune favors the bold', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="22" cy="22" r="10" fill="#2ecc71"/>
  <circle cx="42" cy="22" r="10" fill="#2ecc71"/>
  <circle cx="22" cy="42" r="10" fill="#2ecc71"/>
  <circle cx="42" cy="42" r="10" fill="#2ecc71"/>
  <circle cx="32" cy="32" r="8" fill="#27ae60"/>
  <rect x="30" y="44" width="4" height="12" rx="2" fill="#27ae60"/>
</svg>', '#2ecc71', 'common', false, 'case_system');

-- 3. UNCOMMON: Storm Chaser
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000003', 'Storm Chaser', 'Rides the lightning', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a90d9"/>
      <stop offset="100%" stop-color="#2c3e50"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#sg)"/>
  <polygon points="36,10 24,34 32,34 28,54 44,28 34,28" fill="#f1c40f" stroke="#f39c12" stroke-width="1"/>
</svg>', '#4a90d9', 'uncommon', false, 'case_system');

-- 4. UNCOMMON: Void Walker
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000004', 'Void Walker', 'Steps between worlds', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="vg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#9b59b6"/>
      <stop offset="100%" stop-color="#1a0033"/>
    </radialGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#vg)"/>
  <circle cx="32" cy="32" r="12" fill="none" stroke="#e056fd" stroke-width="2" stroke-dasharray="4 2"/>
  <circle cx="32" cy="32" r="5" fill="#e056fd"/>
  <circle cx="18" cy="20" r="3" fill="#e056fd" opacity="0.6"/>
  <circle cx="46" cy="20" r="3" fill="#e056fd" opacity="0.6"/>
  <circle cx="18" cy="44" r="3" fill="#e056fd" opacity="0.4"/>
  <circle cx="46" cy="44" r="3" fill="#e056fd" opacity="0.4"/>
</svg>', '#9b59b6', 'uncommon', false, 'case_system');

-- 5. RARE: Cyber Samurai
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000005', 'Cyber Samurai', 'Honor in the digital age', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00b4d8"/>
      <stop offset="100%" stop-color="#0077b6"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="#0a0a1a" stroke="url(#cg)" stroke-width="2"/>
  <rect x="20" y="14" width="24" height="28" rx="4" fill="none" stroke="#00b4d8" stroke-width="2"/>
  <line x1="32" y1="14" x2="32" y2="42" stroke="#00b4d8" stroke-width="1"/>
  <rect x="14" y="22" width="6" height="14" rx="2" fill="#00b4d8" opacity="0.7"/>
  <rect x="44" y="22" width="6" height="14" rx="2" fill="#00b4d8" opacity="0.7"/>
  <line x1="20" y1="48" x2="44" y2="48" stroke="#00b4d8" stroke-width="3" stroke-linecap="round"/>
  <circle cx="26" cy="24" r="2" fill="#00ffff"/>
  <circle cx="38" cy="24" r="2" fill="#00ffff"/>
</svg>', '#00b4d8', 'rare', false, 'case_system');

-- 6. RARE: Phantom Flame
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000006', 'Phantom Flame', 'Burns without heat', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="fg" cx="50%" cy="80%" r="70%">
      <stop offset="0%" stop-color="#ff6b35"/>
      <stop offset="60%" stop-color="#c0392b"/>
      <stop offset="100%" stop-color="#1a0000"/>
    </radialGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="#1a0000"/>
  <path d="M32 10 C32 10 42 22 40 30 C38 38 32 36 32 36 C32 36 26 38 24 30 C22 22 32 10 32 10Z" fill="#ff6b35" opacity="0.9"/>
  <path d="M32 18 C32 18 38 26 36 32 C35 35 32 33 32 33 C32 33 29 35 28 32 C26 26 32 18 32 18Z" fill="#ffcc02"/>
  <path d="M32 24 C32 24 35 28 34 31 C33.5 32.5 32 32 32 32 C32 32 30.5 32.5 30 31 C29 28 32 24 32 24Z" fill="white"/>
  <path d="M24 38 C24 44 28 50 32 52 C36 50 40 44 40 38 C40 44 36 48 32 48 C28 48 24 44 24 38Z" fill="#c0392b" opacity="0.6"/>
</svg>', '#ff6b35', 'rare', false, 'case_system');

-- 7. EPIC: Neon Reaper
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000007', 'Neon Reaper', 'Death never looked this good', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="nr" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f0f0f"/>
      <stop offset="100%" stop-color="#1a0033"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#nr)" stroke="#ff00ff" stroke-width="1.5"/>
  <path d="M32 8 L20 28 L26 28 L22 52 L32 40 L42 52 L38 28 L44 28 Z" fill="none" stroke="#ff00ff" stroke-width="2" stroke-linejoin="round"/>
  <path d="M32 8 L20 28 L26 28 L22 52 L32 40 L42 52 L38 28 L44 28 Z" fill="#ff00ff" opacity="0.15"/>
  <circle cx="32" cy="22" r="4" fill="#ff00ff" opacity="0.8"/>
  <line x1="16" y1="34" x2="48" y2="34" stroke="#ff00ff" stroke-width="1" opacity="0.5"/>
</svg>', '#ff00ff', 'epic', false, 'case_system');

-- 8. EPIC: Celestial Dragon
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000008', 'Celestial Dragon', 'Ancient power awakened', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="dg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ff8c00"/>
      <stop offset="50%" stop-color="#e74c3c"/>
      <stop offset="100%" stop-color="#8e0000"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="#0d0d0d" stroke="url(#dg)" stroke-width="2"/>
  <path d="M14 40 C14 40 18 20 32 16 C46 20 50 40 50 40" fill="none" stroke="#ff8c00" stroke-width="2.5" stroke-linecap="round"/>
  <circle cx="24" cy="26" r="3" fill="#ff8c00"/>
  <circle cx="40" cy="26" r="3" fill="#ff8c00"/>
  <path d="M26 34 Q32 40 38 34" fill="none" stroke="#ff8c00" stroke-width="2" stroke-linecap="round"/>
  <path d="M14 16 L20 24 L14 28 Z" fill="#e74c3c"/>
  <path d="M50 16 L44 24 L50 28 Z" fill="#e74c3c"/>
  <path d="M24 46 C24 46 28 54 32 54 C36 54 40 46 40 46" fill="#e74c3c" opacity="0.7"/>
</svg>', '#ff8c00', 'epic', false, 'case_system');

-- 9. LEGENDARY: Abyss Lord
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000009', 'Abyss Lord', 'Rules the endless dark', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="ag" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#1a0040"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <linearGradient id="al" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7b2fff"/>
      <stop offset="50%" stop-color="#ff2fff"/>
      <stop offset="100%" stop-color="#7b2fff"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#ag)" stroke="url(#al)" stroke-width="2"/>
  <polygon points="32,8 36,22 50,22 39,31 43,45 32,37 21,45 25,31 14,22 28,22" fill="none" stroke="#7b2fff" stroke-width="1.5"/>
  <polygon points="32,8 36,22 50,22 39,31 43,45 32,37 21,45 25,31 14,22 28,22" fill="#7b2fff" opacity="0.2"/>
  <circle cx="32" cy="30" r="6" fill="none" stroke="#ff2fff" stroke-width="1.5"/>
  <circle cx="32" cy="30" r="2" fill="#ff2fff"/>
  <circle cx="32" cy="8" r="2" fill="#ff2fff"/>
  <circle cx="50" cy="22" r="2" fill="#7b2fff"/>
  <circle cx="14" cy="22" r="2" fill="#7b2fff"/>
</svg>', '#7b2fff', 'legendary', false, 'case_system');

-- 10. LEGENDARY: Solar Titan
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000010', 'Solar Titan', 'Born from a dying star', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="stg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fffde7"/>
      <stop offset="40%" stop-color="#ffd600"/>
      <stop offset="100%" stop-color="#e65100"/>
    </radialGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="#1a0a00"/>
  <circle cx="32" cy="32" r="16" fill="url(#stg)" opacity="0.9"/>
  <line x1="32" y1="6" x2="32" y2="14" stroke="#ffd600" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="32" y1="50" x2="32" y2="58" stroke="#ffd600" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="6" y1="32" x2="14" y2="32" stroke="#ffd600" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="50" y1="32" x2="58" y2="32" stroke="#ffd600" stroke-width="2.5" stroke-linecap="round"/>
  <line x1="14" y1="14" x2="20" y2="20" stroke="#ff8800" stroke-width="2" stroke-linecap="round"/>
  <line x1="50" y1="14" x2="44" y2="20" stroke="#ff8800" stroke-width="2" stroke-linecap="round"/>
  <line x1="14" y1="50" x2="20" y2="44" stroke="#ff8800" stroke-width="2" stroke-linecap="round"/>
  <line x1="50" y1="50" x2="44" y2="44" stroke="#ff8800" stroke-width="2" stroke-linecap="round"/>
</svg>', '#ffd600', 'legendary', false, 'case_system');

-- 11. MYTHIC: Eternal Crown
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000011', 'Eternal Crown', 'Only the chosen wear this', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="ecg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00ffcc"/>
      <stop offset="33%" stop-color="#00aaff"/>
      <stop offset="66%" stop-color="#aa00ff"/>
      <stop offset="100%" stop-color="#ff00aa"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="28" fill="#050510" stroke="url(#ecg)" stroke-width="2"/>
  <path d="M14 44 L14 28 L22 36 L32 14 L42 36 L50 28 L50 44 Z" fill="none" stroke="url(#ecg)" stroke-width="2.5" stroke-linejoin="round" filter="url(#glow)"/>
  <path d="M14 44 L14 28 L22 36 L32 14 L42 36 L50 28 L50 44 Z" fill="url(#ecg)" opacity="0.15"/>
  <circle cx="32" cy="14" r="3" fill="#00ffcc" filter="url(#glow)"/>
  <circle cx="14" cy="28" r="2.5" fill="#aa00ff" filter="url(#glow)"/>
  <circle cx="50" cy="28" r="2.5" fill="#ff00aa" filter="url(#glow)"/>
  <rect x="14" y="44" width="36" height="4" rx="2" fill="url(#ecg)" opacity="0.8"/>
</svg>', '#00ffcc', 'legendary', false, 'case_system');

-- 12. MYTHIC: Void Sovereign (ultra rare)
INSERT INTO global_badges (id, name, description, icon_url, color, rarity, is_limited, created_by) VALUES
('c1000001-0000-0000-0000-000000000012', 'Void Sovereign', 'One of a kind. Cannot be obtained easily.', '
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <radialGradient id="vsg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="20%" stop-color="#cc00ff"/>
      <stop offset="60%" stop-color="#330066"/>
      <stop offset="100%" stop-color="#000000"/>
    </radialGradient>
    <filter id="glow2">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <circle cx="32" cy="32" r="28" fill="#000000" stroke="#cc00ff" stroke-width="2" filter="url(#glow2)"/>
  <circle cx="32" cy="32" r="20" fill="none" stroke="#cc00ff" stroke-width="1" stroke-dasharray="3 3"/>
  <circle cx="32" cy="32" r="12" fill="none" stroke="#aa00ff" stroke-width="1" stroke-dasharray="2 4"/>
  <circle cx="32" cy="32" r="5" fill="url(#vsg)" filter="url(#glow2)"/>
  <polygon points="32,6 34,14 42,12 37,19 44,24 36,24 36,32 32,26 28,32 28,24 20,24 27,19 22,12 30,14" fill="none" stroke="#cc00ff" stroke-width="1.2" filter="url(#glow2)"/>
  <polygon points="32,6 34,14 42,12 37,19 44,24 36,24 36,32 32,26 28,32 28,24 20,24 27,19 22,12 30,14" fill="#cc00ff" opacity="0.1"/>
</svg>', '#cc00ff', 'legendary', false, 'case_system');


-- ─── STARTER CASE (price: 100) ───────────────────────────────────────────────
-- Mostly coins, lucky clover, coin hoarder — premium/legendary ultra rare

-- Coins 50 (common) — 40% chance
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'coins', 'common', 40.0, 50, 50, NULL);

-- Coins 100 (common) — 25% chance
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'coins', 'common', 25.0, 100, 100, NULL);

-- Coin Hoarder badge (common) — 15% chance
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', 'common', 15.0, 200, NULL, 'c1000001-0000-0000-0000-000000000001');

-- Lucky Clover badge (common) — 10% chance
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', 'common', 10.0, 300, NULL, 'c1000001-0000-0000-0000-000000000002');

-- Storm Chaser badge (uncommon) — 5% chance
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', 'uncommon', 5.0, 600, NULL, 'c1000001-0000-0000-0000-000000000003');

-- Void Walker badge (uncommon) — 3% chance
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', 'uncommon', 3.0, 800, NULL, 'c1000001-0000-0000-0000-000000000004');

-- Cyber Samurai badge (rare) — 1% chance
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', 'rare', 1.0, 2000, NULL, 'c1000001-0000-0000-0000-000000000005');

-- Premium Key (epic) — 0.1% chance (ULTRA RARE in starter)
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'premium_key', 'epic', 0.1, 10000, NULL, NULL);

-- Neon Reaper badge (epic) — 0.8% chance
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', 'epic', 0.8, 5000, NULL, 'c1000001-0000-0000-0000-000000000007');

-- Void Sovereign (legendary) — 0.1% chance
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('7b768dfe-2bc3-48bd-97ee-4ef98d592d72', 'badge', 'legendary', 0.1, 50000, NULL, 'c1000001-0000-0000-0000-000000000012');


-- ─── STANDARD CASE (price: 500) ──────────────────────────────────────────────

-- Coins 200 — 30%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'coins', 'common', 30.0, 200, 200, NULL);

-- Coins 500 — 20%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'coins', 'common', 20.0, 500, 500, NULL);

-- Lucky Clover — 15%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'common', 15.0, 400, NULL, 'c1000001-0000-0000-0000-000000000002');

-- Storm Chaser — 12%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'uncommon', 12.0, 700, NULL, 'c1000001-0000-0000-0000-000000000003');

-- Void Walker — 8%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'uncommon', 8.0, 900, NULL, 'c1000001-0000-0000-0000-000000000004');

-- Cyber Samurai — 6%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'rare', 6.0, 2500, NULL, 'c1000001-0000-0000-0000-000000000005');

-- Phantom Flame — 4%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'rare', 4.0, 3000, NULL, 'c1000001-0000-0000-0000-000000000006');

-- Neon Reaper — 3%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'epic', 3.0, 6000, NULL, 'c1000001-0000-0000-0000-000000000007');

-- Celestial Dragon — 1.5%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'epic', 1.5, 7500, NULL, 'c1000001-0000-0000-0000-000000000008');

-- Premium Key — 0.4%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'premium_key', 'epic', 0.4, 10000, NULL, NULL);

-- Abyss Lord — 0.1%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('8ea65e47-4014-4d0a-ba92-75b219581e08', 'badge', 'legendary', 0.1, 20000, NULL, 'c1000001-0000-0000-0000-000000000009');


-- ─── LEGENDARY CASE (price: 2000) ────────────────────────────────────────────

-- Coins 1000 — 20%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'coins', 'common', 20.0, 1000, 1000, NULL);

-- Coins 2000 — 15%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'coins', 'uncommon', 15.0, 2000, 2000, NULL);

-- Cyber Samurai — 14%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'rare', 14.0, 3000, NULL, 'c1000001-0000-0000-0000-000000000005');

-- Phantom Flame — 12%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'rare', 12.0, 4000, NULL, 'c1000001-0000-0000-0000-000000000006');

-- Neon Reaper — 10%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'epic', 10.0, 8000, NULL, 'c1000001-0000-0000-0000-000000000007');

-- Celestial Dragon — 8%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'epic', 8.0, 9000, NULL, 'c1000001-0000-0000-0000-000000000008');

-- Premium Key — 1%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'premium_key', 'epic', 1.0, 10000, NULL, NULL);

-- Abyss Lord — 8%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'legendary', 8.0, 25000, NULL, 'c1000001-0000-0000-0000-000000000009');

-- Solar Titan — 6%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'legendary', 6.0, 30000, NULL, 'c1000001-0000-0000-0000-000000000010');

-- Eternal Crown — 4%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'legendary', 4.0, 40000, NULL, 'c1000001-0000-0000-0000-000000000011');

-- Void Sovereign — 2%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('b756b111-e083-4c32-b640-9c4a44f1afb8', 'badge', 'legendary', 2.0, 75000, NULL, 'c1000001-0000-0000-0000-000000000012');


-- ─── ULTIMATE CASE (price: 10000) ────────────────────────────────────────────

-- Coins 5000 — 15%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('86dd447c-954c-47e8-93f9-56657ac0a795', 'coins', 'uncommon', 15.0, 5000, 5000, NULL);

-- Coins 10000 — 10%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('86dd447c-954c-47e8-93f9-56657ac0a795', 'coins', 'rare', 10.0, 10000, 10000, NULL);

-- Neon Reaper — 15%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'epic', 15.0, 10000, NULL, 'c1000001-0000-0000-0000-000000000007');

-- Celestial Dragon — 15%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'epic', 15.0, 12000, NULL, 'c1000001-0000-0000-0000-000000000008');

-- Premium Key — 3%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('86dd447c-954c-47e8-93f9-56657ac0a795', 'premium_key', 'epic', 3.0, 10000, NULL, NULL);

-- Abyss Lord — 16%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'legendary', 16.0, 30000, NULL, 'c1000001-0000-0000-0000-000000000009');

-- Solar Titan — 12%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'legendary', 12.0, 35000, NULL, 'c1000001-0000-0000-0000-000000000010');

-- Eternal Crown — 8%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'legendary', 8.0, 50000, NULL, 'c1000001-0000-0000-0000-000000000011');

-- Void Sovereign — 6%
INSERT INTO case_items (case_id, item_type, rarity, drop_rate, display_value, coin_amount, global_badge_id) VALUES
('86dd447c-954c-47e8-93f9-56657ac0a795', 'badge', 'legendary', 6.0, 100000, NULL, 'c1000001-0000-0000-0000-000000000012');
