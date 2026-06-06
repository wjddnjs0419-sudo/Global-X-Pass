import { describe, expect, it } from "vitest";
import { DESKTOP_MAIN_MENUS } from "./mainMenu";

const allItems = DESKTOP_MAIN_MENUS.flatMap((m) => m.items);
const byPath = (path: string) => allItems.find((it) => it.path === path);

describe("mainMenu 게시판 라벨 DB 연동", () => {
  // 게시판 설정(post_categories)에서 이름이 수정되는 항목은 nav 라벨도 DB 라벨을 읽도록
  // category 가 지정돼 있어야 한다. 누락 시 어드민이 이름을 바꿔도 nav 에 반영되지 않는다.
  it.each([
    ["/companies", "companies"],
    ["/consulting", "consulting"],
    ["/founders-club", "founders-club"],
    ["/company-news", "company-news"],
  ])("%s 항목은 category=%s 로 DB 라벨과 연동된다", (path, category) => {
    const item = byPath(path);
    expect(item, `${path} 메뉴 항목이 존재해야 한다`).toBeDefined();
    expect(item?.category).toBe(category);
  });
});
