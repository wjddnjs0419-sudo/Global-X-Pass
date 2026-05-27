import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { supabase } from "../lib/supabaseClient";

/**
 * gated 게시판/페이지의 상세·액션 단위 로그인 게이트.
 * 목록 진입은 허용하되(BoardAccessGate 통과), 상세 열람·신청 등 보호 액션에서만 로그인을 요구한다.
 * - isAuthed: 현재 세션 여부. 초기 확인 중에는 null.
 * - requireAuth(action): 로그인 상태면 action 실행(true 반환), 아니면 /login 으로 보냄(원경로 보존, false).
 * - redirectToLogin(): 즉시 로그인 페이지로 이동(원경로 보존).
 */
export function useAuthGate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) setIsAuthed(Boolean(session));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAuthed(Boolean(session));
    });
    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const redirectToLogin = useCallback(() => {
    navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
  }, [navigate, location]);

  const requireAuth = useCallback(
    async (action?: () => void) => {
      // 마운트 직후 초기 세션 확인(isAuthed === null) 중에는 로그인 사용자를 오인 리다이렉트하지 않도록
      // 세션을 직접 한 번 더 확인한 뒤 판단한다.
      let authed = isAuthed;
      if (authed === null) {
        const { data: { session } } = await supabase.auth.getSession();
        authed = Boolean(session);
        setIsAuthed(authed);
      }
      if (authed) {
        action?.();
        return true;
      }
      redirectToLogin();
      return false;
    },
    [isAuthed, redirectToLogin]
  );

  return { isAuthed, requireAuth, redirectToLogin };
}
