-- 활동로그: 어드민의 게시물 등록/수정/삭제만 기록
--
-- 문제: 참여사 담당자가 행사를 신청하면 event_applications INSERT가
--   sync_event_application_counts → refresh_event_slots_remaining 를 거쳐
--   posts 를 UPDATE(slots_remaining/updated_at) 하고, 이 UPDATE가
--   post_activity_trigger 를 발동시켜 "게시물 수정"으로 잘못 로깅됐다.
--   어드민의 신청 승인/거절 연쇄도 같은 경로로 "게시물 수정"이 됐다.
--
-- 수정: (1) is_admin() 이 아닌 actor 의 변경은 전부 무시 (참여사 연쇄 제외).
--       (2) UPDATE 시 시스템 자동 컬럼(slots_remaining/event_status/updated_at/views)
--           을 제외한 나머지가 OLD=NEW 면 무시 (승인 연쇄·조회수 증가 제외).
--       어드민이 제목/본문/정원/날짜 등을 실제로 바꾸면 정상 로깅된다.

CREATE OR REPLACE FUNCTION public.log_post_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_email TEXT;
    v_name TEXT;
BEGIN
    -- (1) 어드민이 직접 수행한 변경만 기록한다. 참여사 담당자의 행사 신청 등
    --     비어드민 actor 의 SECURITY DEFINER 연쇄 UPDATE 는 여기서 걸러진다.
    IF NOT public.is_admin() THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- (2) UPDATE 인데 시스템 자동 컬럼만 바뀐 경우(정원 동기화·조회수 증가)는 무시.
    IF (TG_OP = 'UPDATE') THEN
        IF (to_jsonb(OLD) - 'slots_remaining' - 'event_status' - 'updated_at' - 'views'
            = to_jsonb(NEW) - 'slots_remaining' - 'event_status' - 'updated_at' - 'views') THEN
            RETURN NEW;
        END IF;
    END IF;

    -- 이메일 가져오기
    v_email := current_setting('request.jwt.claims', true)::json->>'email';

    -- 이름 가져오기 시도 (회원가입 시 입력받은 메타데이터 기준)
    v_name := current_setting('request.jwt.claims', true)::json->'user_metadata'->>'name';
    IF v_name IS NULL THEN
        v_name := current_setting('request.jwt.claims', true)::json->'user_metadata'->>'full_name';
    END IF;

    -- 이름 정보가 없으면 이메일 앞자리를 사용한다.
    IF v_name IS NULL OR v_name = '' THEN
        v_name := split_part(v_email, '@', 1);
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO activity_logs (action, table_name, record_id, user_id, user_email, user_name, new_data)
        VALUES ('INSERT', TG_TABLE_NAME, NEW.id::text, auth.uid(), v_email, v_name, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO activity_logs (action, table_name, record_id, user_id, user_email, user_name, old_data, new_data)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.id::text, auth.uid(), v_email, v_name, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO activity_logs (action, table_name, record_id, user_id, user_email, user_name, old_data)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id::text, auth.uid(), v_email, v_name, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

COMMENT ON FUNCTION public.log_post_activity() IS '게시물 활동로그 기록. 어드민(is_admin) actor 의 INSERT/UPDATE/DELETE 만 기록하며, UPDATE 는 시스템 자동 컬럼(slots_remaining/event_status/updated_at/views)만 바뀌면 무시한다.';
