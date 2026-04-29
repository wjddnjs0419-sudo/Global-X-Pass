


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_fcfs_capacity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$                                                                                           
  DECLARE                                                                                                         
    accepted_count int;
    max_count      int;                                                                                           
  BEGIN                                                     
    SELECT COUNT(*) INTO accepted_count
      FROM founders_club_applications
     WHERE session_id = NEW.session_id AND status = 'accepted';                                                   
   
    SELECT max_participants INTO max_count                                                                        
      FROM founders_club_sessions                           
     WHERE id = NEW.session_id;                                                                                   
   
    IF accepted_count >= max_count THEN                                                                           
      UPDATE founders_club_sessions                         
         SET status = 'closed'
       WHERE id = NEW.session_id;
    END IF;                                                                                                       
   
    RETURN NEW;                                                                                                   
  END;                                                      
  $$;


ALTER FUNCTION "public"."check_fcfs_capacity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, phone, company, user_type)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'company',
    new.raw_user_meta_data->>'user_type'
  );
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_view_count"("row_id" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE posts
  SET views = COALESCE(views, 0) + 1
  WHERE id::text = row_id;
END;
$$;


ALTER FUNCTION "public"."increment_view_count"("row_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$                                                                                                 
    SELECT EXISTS (                                                                                                     
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'                                                   
    );                                                                                                                  
  $$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_post_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_email TEXT;
    v_name TEXT;
BEGIN
    -- 이메일 가져오기
    v_email := current_setting('request.jwt.claims', true)::json->>'email';
    
    -- 💡 이름 가져오기 시도 (회원가입 시 입력받은 메타데이터 기준)
    v_name := current_setting('request.jwt.claims', true)::json->'user_metadata'->>'name';
    IF v_name IS NULL THEN
        v_name := current_setting('request.jwt.claims', true)::json->'user_metadata'->>'full_name';
    END IF;
    
    -- 만약 이름 정보가 없다면 기존처럼 이메일 앞자리를 사용합니다.
    IF v_name IS NULL OR v_name = '' THEN
        v_name := split_part(v_email, '@', 1);
    END IF;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO activity_logs (action, table_name, record_id, user_id, user_email, user_name, new_data)
        VALUES ('INSERT', TG_TABLE_NAME, NEW.id::text, auth.uid(), v_email, v_name, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- 조회수만 오르는 경우는 무시
        IF (OLD.views IS DISTINCT FROM NEW.views AND OLD.title = NEW.title AND OLD.content = NEW.content) THEN
            RETURN NEW;
        END IF;
        
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


ALTER FUNCTION "public"."log_post_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$                                                                                                 
  BEGIN                                                     
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action" "text" NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" "text" NOT NULL,
    "user_id" "uuid",
    "old_data" "jsonb",
    "new_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_name" "text",
    "user_email" "text"
);


ALTER TABLE "public"."activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consultants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "category" "text" NOT NULL,
    "bio" "text",
    "expertise" "text"[] DEFAULT '{}'::"text"[],
    "image_url" "text",
    "is_active" boolean DEFAULT true,
    "display_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "consultants_category_check" CHECK (("category" = ANY (ARRAY['legal'::"text", 'global'::"text", 'tech'::"text"])))
);


ALTER TABLE "public"."consultants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consulting_reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slot_id" "uuid",
    "user_id" "uuid",
    "description" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "admin_note" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "consulting_reservations_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."consulting_reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."consulting_slots" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "consultant_id" "uuid",
    "slot_date" "date" NOT NULL,
    "slot_time" time without time zone NOT NULL,
    "duration_minutes" integer DEFAULT 60,
    "status" "text" DEFAULT 'available'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "consulting_slots_status_check" CHECK (("status" = ANY (ARRAY['available'::"text", 'booked'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."consulting_slots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."founders_club_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid",
    "user_id" "uuid",
    "message" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "founders_club_applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."founders_club_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."founders_club_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "theme" "text" NOT NULL,
    "description" "text",
    "max_participants" integer DEFAULT 6,
    "session_date" "date",
    "session_time" time without time zone,
    "status" "text" DEFAULT 'recruiting'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "founders_club_sessions_max_participants_check" CHECK ((("max_participants" >= 1) AND ("max_participants" <= 10))),
    CONSTRAINT "founders_club_sessions_status_check" CHECK (("status" = ANY (ARRAY['recruiting'::"text", 'closed'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."founders_club_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."page_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visitor_id" "uuid" NOT NULL,
    "page_path" "text" NOT NULL,
    "user_agent" "text",
    "referrer" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."page_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "author_id" "uuid",
    "category" "text" DEFAULT 'notice'::"text",
    "image_url" "text",
    "event_date" "text",
    "location" "text",
    "max_spots" "text",
    "status" "text" DEFAULT '모집중'::"text",
    "title_en" "text",
    "content_en" "text",
    "views" integer DEFAULT 0,
    "is_featured" boolean DEFAULT false,
    "capacity" integer,
    "slots_remaining" integer,
    "tags" "text",
    "event_status" "text",
    "updated_at" timestamp with time zone
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text",
    "role" "text" DEFAULT 'user'::"text",
    "name" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "phone" "text",
    "company" "text",
    "user_type" "text",
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'participant'::"text", 'user'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activity_logs"
    ADD CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consultants"
    ADD CONSTRAINT "consultants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consulting_reservations"
    ADD CONSTRAINT "consulting_reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consulting_slots"
    ADD CONSTRAINT "consulting_slots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."founders_club_applications"
    ADD CONSTRAINT "founders_club_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."founders_club_applications"
    ADD CONSTRAINT "founders_club_applications_session_id_user_id_key" UNIQUE ("session_id", "user_id");



ALTER TABLE ONLY "public"."founders_club_sessions"
    ADD CONSTRAINT "founders_club_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "notices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."consulting_reservations"
    ADD CONSTRAINT "one_reservation_per_slot" UNIQUE ("slot_id");



ALTER TABLE ONLY "public"."page_views"
    ADD CONSTRAINT "page_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_consulting_reservations_user" ON "public"."consulting_reservations" USING "btree" ("user_id");



CREATE INDEX "idx_consulting_slots_date" ON "public"."consulting_slots" USING "btree" ("slot_date", "status");



CREATE INDEX "idx_founders_sessions_status" ON "public"."founders_club_sessions" USING "btree" ("status", "session_date");



CREATE INDEX "idx_page_views_created_at" ON "public"."page_views" USING "btree" ("created_at");



CREATE OR REPLACE TRIGGER "fcfs_auto_close" AFTER INSERT OR UPDATE ON "public"."founders_club_applications" FOR EACH ROW EXECUTE FUNCTION "public"."check_fcfs_capacity"();



CREATE OR REPLACE TRIGGER "post_activity_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."log_post_activity"();



CREATE OR REPLACE TRIGGER "posts_updated_at" BEFORE UPDATE ON "public"."posts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."consulting_reservations"
    ADD CONSTRAINT "consulting_reservations_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "public"."consulting_slots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consulting_reservations"
    ADD CONSTRAINT "consulting_reservations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."consulting_slots"
    ADD CONSTRAINT "consulting_slots_consultant_id_fkey" FOREIGN KEY ("consultant_id") REFERENCES "public"."consultants"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."founders_club_applications"
    ADD CONSTRAINT "founders_club_applications_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."founders_club_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."founders_club_applications"
    ADD CONSTRAINT "founders_club_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "notices_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Admin can read activity logs" ON "public"."activity_logs" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can read all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin can read page views" ON "public"."page_views" FOR SELECT TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "Admin full access on consultants" ON "public"."consultants" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on consulting_reservations" ON "public"."consulting_reservations" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on consulting_slots" ON "public"."consulting_slots" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on founders_club_applications" ON "public"."founders_club_applications" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admin full access on founders_club_sessions" ON "public"."founders_club_sessions" TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Anyone can insert page views" ON "public"."page_views" FOR INSERT TO "authenticated", "anon" WITH CHECK (true);



CREATE POLICY "Anyone can view founders club sessions" ON "public"."founders_club_sessions" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Enable delete for admins only" ON "public"."posts" FOR DELETE USING ((( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = 'admin'::"text"));



CREATE POLICY "Public can view active consultants" ON "public"."consultants" FOR SELECT TO "authenticated", "anon" USING (("is_active" = true));



CREATE POLICY "Public can view available slots" ON "public"."consulting_slots" FOR SELECT TO "authenticated", "anon" USING (true);



CREATE POLICY "Role-based expenses post access" ON "public"."posts" FOR SELECT TO "authenticated" USING ((("category" <> 'expenses'::"text") OR (( SELECT "profiles"."role"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())) = ANY (ARRAY['admin'::"text", 'participant'::"text"]))));



CREATE POLICY "Users can create reservations" ON "public"."consulting_reservations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own founders club applications" ON "public"."founders_club_applications" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read own profile" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "Users can update slot status on booking" ON "public"."consulting_slots" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "Users can view own founders club applications" ON "public"."founders_club_applications" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own reservations" ON "public"."consulting_reservations" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."activity_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admins can write posts" ON "public"."posts" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



ALTER TABLE "public"."consultants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consulting_reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."consulting_slots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."founders_club_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."founders_club_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."page_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "관리자 회원 권한 수정 가능" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (true);



CREATE POLICY "관리자 회원 삭제 가능" ON "public"."profiles" FOR DELETE TO "authenticated" USING (true);



CREATE POLICY "관리자 회원 추가(CSV) 가능" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "관리자만 게시물 삭제 가능" ON "public"."posts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"text") OR (("auth"."jwt"() ->> 'email'::"text") = 'admin@test.com'::"text"))))));



CREATE POLICY "관리자만 게시물 수정 가능" ON "public"."posts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND (("profiles"."role" = 'admin'::"text") OR (("auth"."jwt"() ->> 'email'::"text") = 'admin@test.com'::"text"))))));



CREATE POLICY "관리자만 쓰기 가능" ON "public"."posts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "회원만 읽기 가능" ON "public"."posts" FOR SELECT TO "authenticated" USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."activity_logs";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."profiles";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."check_fcfs_capacity"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_fcfs_capacity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_fcfs_capacity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_view_count"("row_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_view_count"("row_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_view_count"("row_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_post_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_post_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_post_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."consultants" TO "anon";
GRANT ALL ON TABLE "public"."consultants" TO "authenticated";
GRANT ALL ON TABLE "public"."consultants" TO "service_role";



GRANT ALL ON TABLE "public"."consulting_reservations" TO "anon";
GRANT ALL ON TABLE "public"."consulting_reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."consulting_reservations" TO "service_role";



GRANT ALL ON TABLE "public"."consulting_slots" TO "anon";
GRANT ALL ON TABLE "public"."consulting_slots" TO "authenticated";
GRANT ALL ON TABLE "public"."consulting_slots" TO "service_role";



GRANT ALL ON TABLE "public"."founders_club_applications" TO "anon";
GRANT ALL ON TABLE "public"."founders_club_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."founders_club_applications" TO "service_role";



GRANT ALL ON TABLE "public"."founders_club_sessions" TO "anon";
GRANT ALL ON TABLE "public"."founders_club_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."founders_club_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."page_views" TO "anon";
GRANT ALL ON TABLE "public"."page_views" TO "authenticated";
GRANT ALL ON TABLE "public"."page_views" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

drop policy "Public can view active consultants" on "public"."consultants";

drop policy "Public can view available slots" on "public"."consulting_slots";

drop policy "Anyone can view founders club sessions" on "public"."founders_club_sessions";

drop policy "Anyone can insert page views" on "public"."page_views";


  create policy "Public can view active consultants"
  on "public"."consultants"
  as permissive
  for select
  to anon, authenticated
using ((is_active = true));



  create policy "Public can view available slots"
  on "public"."consulting_slots"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Anyone can view founders club sessions"
  on "public"."founders_club_sessions"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Anyone can insert page views"
  on "public"."page_views"
  as permissive
  for insert
  to anon, authenticated
with check (true);


CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "누구나 사진 보기 가능"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'images'::text));



  create policy "누구나 사진 올리기 가능"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'images'::text));



