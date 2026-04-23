-- ============================================================
-- 営業用プロファイリングツール DB設計
-- Supabase (PostgreSQL) に実行する
-- ============================================================

-- ① ユーザーテーブル（Supabase Authと連携）
CREATE TABLE users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'sales' CHECK (role IN ('admin', 'sales')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 管理者判定ヘルパー（SECURITY DEFINER で RLS をバイパス → ポリシー内の再帰を防ぐ）
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
$$;

-- RLS: 自分のレコードのみ参照可 / admin は全件参照可
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_admin_all"  ON users FOR ALL   USING (is_admin());

-- ② プロファイルログテーブル（生成履歴）
CREATE TABLE profile_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name       TEXT NOT NULL,            -- 生成した営業担当者名
  target_name     TEXT NOT NULL,            -- 対象者の氏名
  birth_date      DATE,                     -- 対象者の生年月日（不明な場合は NULL）
  gender          TEXT NOT NULL CHECK (gender IN ('男', '女')),
  fortune_result  JSONB NOT NULL,           -- 占い計算結果（非公開）
  profile_output  TEXT NOT NULL,            -- 生成されたプロファイル文
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: 自分が生成したログのみ参照可 / adminは全件参照可
ALTER TABLE profile_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_select_own"  ON profile_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "logs_insert_own"  ON profile_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "logs_admin_all"   ON profile_logs FOR ALL   USING (is_admin());

-- ③ インデックス
CREATE INDEX idx_profile_logs_user_id    ON profile_logs(user_id);
CREATE INDEX idx_profile_logs_created_at ON profile_logs(created_at DESC);
CREATE INDEX idx_profile_logs_target     ON profile_logs(target_name);

-- ④ Supabase Auth トリガー（ユーザー登録時に自動でusersレコード作成）
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
