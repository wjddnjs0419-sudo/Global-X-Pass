import { useState, useEffect, useId } from "react";
import { supabase } from "../lib/supabaseClient";
import { getDefaultPresets } from "../utils/categoryStore";

/**
 * Supabase `board_tag_presets` 테이블에서 게시판별 태그 프리셋을 가져오고
 * Realtime 변경을 자동 반영하는 공유 훅.
 * DB 행이 없으면 getDefaultPresets() 정적 폴백을 반환한다.
 */
export function useBoardTagPresets(boardId: string) {
  const instanceId = useId();
  const [presets, setPresets] = useState<string[]>(() => getDefaultPresets(boardId));

  useEffect(() => {
    if (!boardId) {
      setPresets([]);
      return;
    }

    let mounted = true;
    setPresets(getDefaultPresets(boardId));

    const refresh = async () => {
      const { data } = await supabase
        .from("board_tag_presets")
        .select("tag")
        .eq("board_id", boardId)
        .eq("is_hidden", false)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (!mounted) return;
      if (data && data.length > 0) {
        setPresets(data.map((r) => r.tag));
      } else {
        setPresets(getDefaultPresets(boardId));
      }
    };

    refresh();

    const channel = supabase
      .channel(`board_tag_presets_${boardId}_${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "board_tag_presets", filter: `board_id=eq.${boardId}` },
        () => { if (mounted) refresh(); }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [boardId, instanceId]);

  const addTag = async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed || !boardId) return;
    await supabase
      .from("board_tag_presets")
      .upsert({ board_id: boardId, tag: trimmed, is_hidden: false }, { onConflict: "board_id,tag" });
  };

  const hideTag = async (tag: string) => {
    if (!boardId) return;
    await supabase
      .from("board_tag_presets")
      .upsert({ board_id: boardId, tag, is_hidden: true }, { onConflict: "board_id,tag" });
  };

  return { presets, addTag, hideTag };
}
