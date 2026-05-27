import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { supabase } from "../../lib/supabaseClient";
import { useBoardAccess } from "../../hooks/useBoardAccess";

interface BoardAccessGateProps {
  category: string;
  children: React.ReactNode;
}

/**
 * 게시판/특수 페이지(카테고리) 진입 접근을 동적으로 평가해 렌더를 게이팅한다.
 * 게시물 없는 특수 페이지(companies 등, kind=page)도 category 만 넘기면 공용으로 사용한다.
 * - access_level !== 'private': anon/로그인 무관 통과 (public·gated 는 목록 진입 허용)
 * - access_level === 'private' + 비로그인: /login 으로 리다이렉트(원래 경로 보존)
 * - access_level === 'private' + 로그인: 통과
 * - 카테고리 미존재: 홈으로 리다이렉트(잘못된 호출 방지)
 * 상세/액션 단위 로그인(gated)은 각 페이지가 accessLevel 로 별도 처리한다.
 */
export function BoardAccessGate({ category, children }: BoardAccessGateProps) {
  const board = useBoardAccess(category);
  const location = useLocation();
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setIsAuthed(Boolean(session));
      setAuthChecked(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setIsAuthed(Boolean(session));
      setAuthChecked(true);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (board.loading || !authChecked) {
    return <div aria-hidden style={{ visibility: "hidden" }} />;
  }

  if (board.notFound) {
    return <Navigate to="/" replace />;
  }

  if (board.accessLevel === "private" && !isAuthed) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <>{children}</>;
}
