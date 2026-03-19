-- toshiotawa@me.com を LemonSqueezy 課金済みユーザーとして設定
-- iOS版で IAP 決済が開始されないようにするため
UPDATE profiles
SET lemon_subscription_status = 'active',
    lemon_customer_id = 'manual_lemon_user',
    rank = 'premium'
WHERE email = 'toshiotawa@me.com';
