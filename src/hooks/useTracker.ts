import { useEffect } from "react";
import { useLocation } from "react-router";
import { supabase } from "../lib/supabaseClient";

export function useTracker() {
  const location = useLocation();

  useEffect(() => {
    const trackVisit = async () => {
      let visitorId = localStorage.getItem("visitor_id");
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("visitor_id", visitorId);
      }

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
