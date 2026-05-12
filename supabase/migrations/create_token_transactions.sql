-- Create token_transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'spend', 'earning', 'withdrawal_pending', 'withdrawal_completed', 'refund')),
    token_amount INTEGER NOT NULL,
    bonus_tokens INTEGER DEFAULT 0,
    usd_amount DECIMAL(10, 2),
    paddle_transaction_id TEXT,
    paddle_fee_amount DECIMAL(10, 2),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX idx_token_transactions_type ON token_transactions(transaction_type);
CREATE INDEX idx_token_transactions_paddle_id ON token_transactions(paddle_transaction_id);
CREATE INDEX idx_token_transactions_created_at ON token_transactions(created_at DESC);

-- Add token_balance column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='token_balance') THEN
        ALTER TABLE users ADD COLUMN token_balance INTEGER DEFAULT 0 NOT NULL;
    END IF;
END $$;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for token_transactions
DROP TRIGGER IF EXISTS update_token_transactions_updated_at ON token_transactions;
CREATE TRIGGER update_token_transactions_updated_at
    BEFORE UPDATE ON token_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
    ON token_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert transactions (for webhooks)
CREATE POLICY "Service role can insert transactions"
    ON token_transactions FOR INSERT
    WITH CHECK (true);

-- Service role can update transactions
CREATE POLICY "Service role can update transactions"
    ON token_transactions FOR UPDATE
    USING (true);

COMMENT ON TABLE token_transactions IS 'Stores all token-related transactions including purchases, spending, earnings, and withdrawals';
COMMENT ON COLUMN token_transactions.transaction_type IS 'Type of transaction: purchase, spend, earning, withdrawal_pending, withdrawal_completed, refund';
COMMENT ON COLUMN token_transactions.status IS 'Transaction status: pending, completed, failed, refunded';
COMMENT ON COLUMN token_transactions.metadata IS 'Additional transaction data stored as JSON';
