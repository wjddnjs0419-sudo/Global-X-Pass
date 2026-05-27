import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "../lib/supabaseClient";
import type { PostCategory } from "../lib/types";

export type BoardCategoryOption = Pick<
  PostCategory,
  "id" | "label" | "description" | "is_public" | "access_level" | "kind" | "sort_order"
>;

type BoardMeta = {
  labels: Record<string, string>;
  descriptions: Record<string, string | null>;
  list: BoardCategoryOption[];
};

const EMPTY: BoardMeta = { labels: {}, descriptions: {}, list: [] };

const BoardCategoriesContext = createContext<BoardMeta>(EMPTY);

/**
 * post_categories 의 라벨/설명을 한 번만 조회하고 Realtime 으로 갱신해
 * 네비게이션·게시판 페이지·관리자 화면이 동일한 단일 진실원천
 * (post_categories.label / description)을 사용하도록 공유하는 Provider.
 * 관리자가 게시판 이름·설명을 바꾸면 즉시 반영된다.
 */
export function BoardCategoriesProvider({ children }: { children: ReactNode }) {
  const [meta, setMeta] = useState<BoardMeta>(EMPTY);

  useEffect(() => {
    let mounted = true;

    const refresh = async () => {
      const { data, error } = await supabase
        .from("post_categories")
        .select("id, label, description, is_public, access_level, kind, sort_order")
        .order("sort_order", { ascending: true });
      if (!mounted || error || !data) return;
      const all = data as BoardCategoryOption[];
      const labels: Record<string, string> = {};
      const descriptions: Record<string, string | null> = {};
      all.forEach((c) => {
        labels[c.id] = c.label;
        descriptions[c.id] = c.description;
      });
      // 라벨/설명 맵은 전체(특수 페이지 포함)이지만, list 는 게시물 게시판(kind=board)만 노출한다.
      const list = all.filter((c) => c.kind === "board");
      setMeta({ labels, descriptions, list });
    };

    refresh();

    const channel = supabase
      .channel("board-categories-meta")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_categories" },
        () => {
          if (mounted) refresh();
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return <BoardCategoriesContext.Provider value={meta}>{children}</BoardCategoriesContext.Provider>;
}

/** 전체 게시판 라벨 맵(id → label). 로딩 중에는 빈 객체. */
export function useBoardCategoryLabels(): Record<string, string> {
  return useContext(BoardCategoriesContext).labels;
}

/** sort_order 순으로 정렬된 게시물 게시판(kind=board) 목록. 특수 페이지는 제외. 로딩 전에는 빈 배열. */
export function useBoardCategoryList(): BoardCategoryOption[] {
  return useContext(BoardCategoriesContext).list;
}

/** 단일 게시판 라벨. 로딩 전/미존재 시 fallback 반환. */
export function useBoardCategoryLabel(id: string, fallback: string): string {
  return useContext(BoardCategoriesContext).labels[id] ?? fallback;
}

/** 단일 게시판 설명(페이지 부제 용). 비어있거나 미존재 시 fallback 반환. */
export function useBoardCategoryDescription(id: string, fallback: string): string {
  const description = useContext(BoardCategoriesContext).descriptions[id];
  return description && description.trim() ? description : fallback;
}
