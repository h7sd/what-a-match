/*
  # Create admin_give_coins function

  1. New Functions
    - `admin_give_coins` - Allows admins to give or take coins from users
      - Takes user_id (UUID), amount_text (TEXT), and reason (TEXT)
      - Validates admin role
      - Parses and validates amount
      - Updates user balance
      - Logs transaction
      - Returns success/error response
  
  2. Security
    - SECURITY DEFINER to allow admins to update any user's balance
    - Checks admin role before proceeding
    - Enforces integer amounts (no decimals)
*/

CREATE OR REPLACE FUNCTION public.admin_give_coins(
  p_user_id UUID,
  p_amount_text TEXT,
  p_reason TEXT DEFAULT 'Admin bonus'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_amount numeric;
  v_new_balance numeric;
  v_username TEXT;
BEGIN
  v_admin_id := auth.uid();

  -- Check if caller is admin
  IF NOT public.has_role(v_admin_id, 'admin') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authorized');
  END IF;

  -- Parse amount
  BEGIN
    v_amount := trim(p_amount_text)::numeric;
  EXCEPTION WHEN others THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END;

  -- Enforce integer currency
  IF v_amount <> trunc(v_amount) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount must be a whole number');
  END IF;

  -- Validate amount
  IF v_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Amount cannot be zero');
  END IF;

  -- Get username for logging
  SELECT username INTO v_username FROM public.profiles WHERE user_id = p_user_id;
  IF v_username IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Upsert user balance
  INSERT INTO public.user_balances (user_id, balance, total_earned)
  VALUES (
    p_user_id,
    GREATEST(v_amount, 0),
    CASE WHEN v_amount > 0 THEN v_amount ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE SET
    balance = GREATEST(user_balances.balance + v_amount, 0),
    total_earned = CASE
      WHEN v_amount > 0 THEN user_balances.total_earned + v_amount
      ELSE user_balances.total_earned
    END,
    updated_at = now();

  -- Get new balance
  SELECT balance INTO v_new_balance FROM public.user_balances WHERE user_id = p_user_id;

  -- Log the transaction
  INSERT INTO public.uv_transactions (user_id, amount, transaction_type, description)
  VALUES (
    p_user_id,
    v_amount,
    CASE WHEN v_amount > 0 THEN 'earn' ELSE 'spend' END,
    COALESCE(p_reason, 'Admin bonus')
  );

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Coins updated successfully',
    'new_balance', v_new_balance::text,
    'amount', v_amount::text
  );
END;
$$;