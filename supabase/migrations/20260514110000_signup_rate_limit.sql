-- IP 기반 회원가입 횟수 제한 테이블
CREATE TABLE signup_rate_limit (
  ip          TEXT        NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX ON signup_rate_limit (ip, attempted_at);
CREATE INDEX ON signup_rate_limit (attempted_at);

-- 외부에서 직접 접근 불가 (서비스 키만 접근 가능)
ALTER TABLE signup_rate_limit ENABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE signup_rate_limit TO service_role;
