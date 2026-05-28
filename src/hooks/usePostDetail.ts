import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { supabase } from "../lib/supabaseClient";
import type { BoardAccessLevel, Post } from "../lib/types";
import { safeRandomUUID } from "../utils/uuid";

type PostAccessInfo = {
  category: string;
  requires_auth: boolean;
  requires_participant_role: boolean;
};

const getOrCreateVisitorId = () => {
  let visitorId = localStorage.getItem("visitor_id");
  if (!visitorId) {
    visitorId = safeRandomUUID();
    localStorage.setItem("visitor_id", visitorId);
  }
  return visitorId;
};

export type UsePostDetailResult = {
  post: Post | null;
  loading: boolean;
  loadError: string | null;
  refetch: () => Promise<void>;
};

export function usePostDetail(id: string | undefined): UsePostDetailResult {
  const navigate = useNavigate();
  const location = useLocation();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 게시물 A→B 빠른 전환 시 A 응답이 B 화면에 반영되는 race condition 차단용.
  const activeIdRef = useRef<string | null>(null);
  // StrictMode dev 더블 마운트 시 increment_view_count 가 1회만 호출되도록 가드.
  const incrementedForIdRef = useRef<string | null>(null);

  // navigate/location 은 closure 로만 사용하고 effect deps 에는 넣지 않는다.
  // 라우터 인스턴스가 매 렌더 새로 만들어져도 fetch 가 재실행되지 않도록 ref 로 안정화한다.
  const navigateRef = useRef(navigate);
  const locationRef = useRef(location);
  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { locationRef.current = location; }, [location]);

  const runFetch = useCallback(async (incrementView: boolean) => {
    if (!id) {
      setPost(null);
      setLoadError("잘못된 게시물 주소입니다.");
      setLoading(false);
      return;
    }

    activeIdRef.current = id;
    const requestId = id;
    const isStale = () => activeIdRef.current !== requestId;

    try {
      setLoadError(null);

      const [{ data: { session } }, accessResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.rpc("get_post_access_info", { post_id: id }).maybeSingle(),
      ]);
      if (isStale()) return;
      const accessInfo = accessResult.data as PostAccessInfo | null;

      if (accessInfo?.requires_auth && !session) {
        const loc = locationRef.current;
        navigateRef.current("/login", {
          replace: true,
          state: { from: `${loc.pathname}${loc.search}` },
        });
        return;
      }

      if (accessInfo?.requires_participant_role && session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (isStale()) return;
        const role = profile?.role;
        if (role !== "admin" && role !== "participant") {
          setPost(null);
          setLoadError("이 게시물은 참여사 담당자와 관리자만 열람할 수 있습니다.");
          return;
        }
      }

      const { data, error } = await supabase.from("posts").select("*").eq("id", id).maybeSingle();
      if (isStale()) return;
      if (error) throw error;

      if (!data) {
        setPost(null);
        setLoadError("게시물을 찾을 수 없습니다.");
        return;
      }

      // RPC 미응답 시 게시판 access_level 로 보수적 fallback (public 외에는 상세 로그인).
      if (!accessInfo && !session) {
        const { data: cat } = await supabase
          .from("post_categories")
          .select("access_level")
          .eq("id", data.category)
          .maybeSingle<{ access_level: BoardAccessLevel }>();
        if (isStale()) return;
        if ((cat?.access_level ?? "private") !== "public") {
          const loc = locationRef.current;
          navigateRef.current("/login", {
            replace: true,
            state: { from: `${loc.pathname}${loc.search}` },
          });
          return;
        }
      }

      if (data.category === "events" && new URLSearchParams(locationRef.current.search).get("edit") !== "1") {
        navigateRef.current(`/events/${data.id}/apply`, { replace: true });
        return;
      }

      setPost({ ...(data as Post), views: ((data as Post).views || 0) } as Post);

      if (incrementView && incrementedForIdRef.current !== id) {
        incrementedForIdRef.current = id;
        const visitorId = getOrCreateVisitorId();
        void supabase
          .rpc("increment_view_count", {
            row_id: id,
            visitor_id: visitorId,
          })
          .then(({ data: incremented, error: rpcError }) => {
            if (rpcError) {
              console.error("Failed to increment post view:", rpcError);
              return;
            }
            if (!incremented) return;
            if (activeIdRef.current !== requestId) return;
            setPost((current) => (
              current && current.id === data.id
                ? ({ ...current, views: (current.views || 0) + 1 } as Post)
                : current
            ));
          });
      }
    } catch (error) {
      if (isStale()) return;
      console.error("Failed to load post detail:", { id, error });
      setPost(null);
      setLoadError("게시물을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      if (!isStale()) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    setPost(null);
    setLoadError(null);
    void runFetch(true);
  }, [id, runFetch]);

  const refetch = useCallback(() => runFetch(false), [runFetch]);

  return { post, loading, loadError, refetch };
}
