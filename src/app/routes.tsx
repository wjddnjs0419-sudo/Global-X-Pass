import { PostDetailPage } from "./pages/PostDetailPage";
import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./components/HomePage";
import { NoticePage } from "./pages/NoticePage";
import { NewsPage } from "./pages/NewsPage";
import { EventsPage } from "./pages/EventsPage";
import { EventArchivePage } from "./pages/EventArchivePage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { BlogPage } from "./pages/BlogPage";
import { FaqPage } from "./pages/FaqPage";
import { LoginPage } from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { MyPage } from "./pages/MyPage";
import { SearchPage } from "./pages/SearchPage";
// 💡 1. 여기에 새 페이지를 불러오는 코드를 추가했습니다.
import UpdatePasswordPage from "./pages/UpdatePasswordPage"; 
import AdminPage from "./pages/AdminPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "notice", Component: NoticePage },
      { path: "news", Component: NewsPage },
      { path: "events", Component: EventsPage },
      { path: "events/archive", Component: EventArchivePage },
      { path: "resources", Component: ResourcesPage },
      { path: "blog", Component: BlogPage },
      { path: "faq", Component: FaqPage },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
      { path: "mypage", Component: MyPage },
      { path: "search", Component: SearchPage },
      // 💡 2. 여기에 'update-password' 경로를 추가했습니다.
      { path: "update-password", Component: UpdatePasswordPage }, 
      { path: "admin", Component: AdminPage },
      { path: "post/:id", Component: PostDetailPage }, 
      { path: "design-system", Component: () => null },
    ],
  },
]);