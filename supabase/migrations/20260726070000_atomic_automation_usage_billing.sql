ALTER TABLE token_transactions
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_token_transactions_idempotency_key
  ON token_transactions(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE OR REPLACE FUNCTION record_successful_automation_usage(
  p_user_id UUID,
  p_automation_id UUID,
  p_automation_name TEXT,
  p_developer_email TEXT,
  p_engine TEXT,
  p_execution_id TEXT,
  p_token_cost INTEGER,
  p_usd_per_token NUMERIC
)
RETURNS TABLE (
  tokens_remaining INTEGER,
  charged BOOLEAN,
  creator_credited BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_runner users%ROWTYPE;
  v_creator users%ROWTYPE;
  v_usage_key TEXT;
  v_creator_key TEXT;
  v_usd_amount NUMERIC;
BEGIN
  IF COALESCE(p_token_cost, 0) <= 0 THEN
    RETURN QUERY SELECT NULL::INTEGER, FALSE, FALSE;
    RETURN;
  END IF;

  IF p_execution_id IS NULL OR btrim(p_execution_id) = '' THEN
    RAISE EXCEPTION 'A successful engine execution ID is required before charging tokens'
      USING ERRCODE = '22023';
  END IF;

  IF p_engine IS NULL OR btrim(p_engine) = '' THEN
    RAISE EXCEPTION 'The execution engine is required before charging tokens'
      USING ERRCODE = '22023';
  END IF;

  v_usage_key := concat_ws(
    ':',
    'automation-usage-v1',
    p_engine,
    p_automation_id::TEXT,
    p_user_id::TEXT,
    p_execution_id
  );
  v_creator_key := v_usage_key || ':creator';
  v_usd_amount := p_token_cost * p_usd_per_token;

  SELECT *
  INTO v_runner
  FROM users
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found while charging tokens'
      USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM token_transactions
    WHERE idempotency_key = v_usage_key
  ) THEN
    RETURN QUERY SELECT v_runner.token_balance, FALSE, FALSE;
    RETURN;
  END IF;

  IF v_runner.token_balance < p_token_cost THEN
    RAISE EXCEPTION 'Insufficient token balance'
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE users
  SET token_balance = token_balance - p_token_cost
  WHERE id = p_user_id
  RETURNING * INTO v_runner;

  INSERT INTO token_transactions (
    user_id,
    transaction_type,
    token_amount,
    usd_amount,
    status,
    idempotency_key,
    metadata
  )
  VALUES (
    p_user_id,
    'spend',
    -p_token_cost,
    -v_usd_amount,
    'completed',
    v_usage_key,
    jsonb_build_object(
      'automation_id', p_automation_id,
      'automation_name', p_automation_name,
      'developer_email', p_developer_email,
      'engine', p_engine,
      'execution_id', p_execution_id
    )
  );

  creator_credited := FALSE;
  IF p_developer_email IS NOT NULL
    AND btrim(p_developer_email) <> ''
    AND lower(p_developer_email) <> lower(v_runner.email)
  THEN
    SELECT *
    INTO v_creator
    FROM users
    WHERE lower(email) = lower(p_developer_email);

    IF FOUND THEN
      UPDATE users
      SET total_earnings_usd = COALESCE(total_earnings_usd, 0) + v_usd_amount
      WHERE id = v_creator.id;

      INSERT INTO token_transactions (
        user_id,
        transaction_type,
        token_amount,
        usd_amount,
        status,
        idempotency_key,
        metadata
      )
      VALUES (
        v_creator.id,
        'earning',
        p_token_cost,
        v_usd_amount,
        'completed',
        v_creator_key,
        jsonb_build_object(
          'automation_id', p_automation_id,
          'automation_name', p_automation_name,
          'runner_id', p_user_id,
          'runner_email', v_runner.email,
          'engine', p_engine,
          'execution_id', p_execution_id
        )
      );
      creator_credited := TRUE;
    END IF;
  END IF;

  RETURN QUERY SELECT v_runner.token_balance, TRUE, creator_credited;
END;
$$;

REVOKE ALL ON FUNCTION record_successful_automation_usage(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION record_successful_automation_usage(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC
) TO service_role;

COMMENT ON COLUMN token_transactions.idempotency_key IS
  'Unique successful engine execution key; retries return the existing charge instead of spending again';

COMMENT ON FUNCTION record_successful_automation_usage(
  UUID, UUID, TEXT, TEXT, TEXT, TEXT, INTEGER, NUMERIC
) IS
  'Atomically charges one successful automation execution and credits its creator exactly once';
