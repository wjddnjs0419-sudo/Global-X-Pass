import { useEffect, useId, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { BoardAccessLevel, PostCategory } from "../lib/types";

export interface BoardAccessState {
  /** 목록 진입 가능 여부 (access_level !== 'private'). */
  isPublic: boolean;
  /** public | gated | private. 상세/액션 게이트 판단의 단일 진실원천. */
  accessLevel: BoardAccessLevel;
  isLocked: boolean;
  label: string | null;
  description: string | null;
  loading: boolean;
  notFound: boolean;
}

/**
 * post_categories 테이블에서 게시판(카테고리) 메타데이터를 가져오고
 * Realtime 변경을 자동 반영하는 훅. 카테고리가 존재하지 않으면 notFound=true.
 * 안전 기본값: 로딩 중에는 access_level='private'(게이트 닫힘) → 라우트 통과 후 UI 깜박임 방지.
 */
export function useBoardAccess(category: string): BoardAccessState {
  const instanceId = useId();
  const [state, setState] = useState<BoardAccessState>({
    isPublic: false,
    accessLevel: "private",
    isLocked: false,
    label: null,
    description: null,
    loading: true,
    notFound: false,
  });

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const { data, error } = await supabase
        .from("post_categories")
        .select("id, label, description, is_public, is_locked, access_level")
        .eq("id", category)
        .maybeSingle<Pick<PostCategory, "id" | "label" | "description" | "is_public" | "is_locked" | "access_level">>();

      if (!mounted) return;

      if (error || !data) {
        setState({
          isPublic: false,
          accessLevel: "private",
          isLocked: false,
          label: null,
          description: null,
          loading: false,
          notFound: true,
        });
        return;
      }

      setState({
        isPublic: data.is_public,
        accessLevel: data.access_level,
        isLocked: data.is_locked,
        label: data.label,
        description: data.description,
        loading: false,
        notFound: false,
      });
    };

    refresh();

    const channel = supabase
      .channel(`post_categories_${category}_${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_categories", filter: `id=eq.${category}` },
        () => {
          if (mounted) refresh();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [category, instanceId]);

  return state;
}
