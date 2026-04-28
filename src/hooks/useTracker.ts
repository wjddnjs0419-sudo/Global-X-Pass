import { useEffect } from "react";
import { useLocation } from "react-router";
import { supabase } from "../lib/supabaseClient";

const THROTTLE_MS = 30 * 60 * 1000; // 같은 페이지 30분 내 재방문은 기록 안 함

export function useTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      let visitorId = localStorage.getItem("visitor_id");
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("visitor_id", visitorId);
      }

      const cacheKey = `pv_${location.pathname}`;
      const lastTracked = localStorage.getItem(cacheKey);
      if (lastTracked && Date.now() - parseInt(lastTracked) < THROTTLE_MS) return;
      localStorage.setItem(cacheKey, Date.now().toString());

      const { error } = await supabase.from("page_views").insert({
        visitor_id: visitorId,
        page_path: location.pathname,
        user_agent: navigator.userAgent,
        referrer: document.referrer,
      });

      if (error) console.error("Failed to track page view:", error);
    };

    trackVisit();
  }, [location.pathname]);
}
