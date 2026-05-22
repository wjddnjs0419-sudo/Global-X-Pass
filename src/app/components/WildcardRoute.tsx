import { useLocation } from "react-router";
import { DESKTOP_MAIN_MENUS } from "../navigation/mainMenu";
import { ComingSoonPage } from "../pages/ComingSoonPage";
import { NotFoundPage } from "../pages/NotFoundPage";

function isComingSoon(pathname: string): boolean {
  return DESKTOP_MAIN_MENUS.some((menu) =>
    menu.items.some((item) => item.comingSoon && item.path === pathname)
  );
}

export function WildcardRoute() {
  const { pathname } = useLocation();
  return isComingSoon(pathname) ? <ComingSoonPage /> : <NotFoundPage />;
}
