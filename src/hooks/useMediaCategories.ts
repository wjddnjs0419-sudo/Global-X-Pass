import { useState, useEffect, useId } from "react";
import { supabase } from "../lib/supabaseClient";
import { buildMediaCategories, getMediaCategories, type MediaCategory } from "../app/constants/mediaCategories";

/**
 * Supabase `media_category_labels` 테이블에서 미디어 카테고리 표시명을 가져오고
 * Realtime 변경을 자동 반영하는 공유 훅.
 * 초기값은 defaultLabel 기반 폴백을 즉시 반환하며, fetch 완료 후 Supabase 값으로 교체된다.
 */
export function useMediaCategories(): MediaCategory[] {
  const instanceId = useId();
  const [categories, setCategories] = useState<MediaCategory[]>(() => getMediaCategories());

  useEffect(() => {
    let mounted = true;

    const refresh = () => {
      supabase
        .from("media_category_labels")
        .select("id, label")
        .then(({ data }) => {
          if (!mounted || !data) return;
          setCategories(buildMediaCategories(data));
        });
    };

    refresh();

    const channel = supabase
      .channel(`media_category_labels_${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "media_category_labels" },
        () => {
          if (mounted) refresh();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [instanceId]);

  return categories;
}
