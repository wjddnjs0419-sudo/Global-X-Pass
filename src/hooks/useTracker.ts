import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { supabase } from '../lib/supabaseClient'; // lib 폴더 안에 있는 클라이언트 참조

export function useTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      // 1. 브라우저 로컬 스토리지에서 기존 방문자 ID 확인, 없으면 새로 생성
      let visitorId = localStorage.getItem('visitor_id');
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('visitor_id', visitorId);
      }

      // 2. Supabase의 page_views 테이블에 데이터 주입
      const { error } = await supabase.from('page_views').insert({
        visitor_id: visitorId,
        page_path: location.pathname, // 현재 접속한 페이지 경로 (예: /, /admin)
        user_agent: navigator.userAgent, // 브라우저 정보
        referrer: document.referrer // 유입 경로
      });

      if (error) console.error("방문 기록 저장 실패:", error);
    };

    trackVisit();
  }, [location.pathname]); // 페이지가 바뀔 때마다(URL 변경 시) 실행
}