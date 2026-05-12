import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./components/HomePage";
import { NoticePage } from "./pages/NoticePage";
import { NewsPage } from "./pages/NewsPage";
import { EventsPage } from "./pages/EventsPage";
import { EventApplicationPage } from "./pages/EventApplicationPage";
import { EventArchivePage } from "./pages/EventArchivePage";
import { ResourcesPage } from "./pages/ResourcesPage";
import { MediaPage } from "./pages/MediaPage";
import { BlogPage } from "./pages/BlogPage";
import { FaqPage } from "./pages/FaqPage";
import { LoginPage } from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { MyPage } from "./pages/MyPage";
import { SearchPage } from "./pages/SearchPage";
import UpdatePasswordPage from "./pages/UpdatePasswordPage";
import AdminPage from "./pages/AdminPage";
import { AdminRoute } from "./components/AdminRoute";
import { AuthRoute } from "./components/AuthRoute";
import { PostDetailPage } from "./pages/PostDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { ConsultingPage } from "./pages/ConsultingPage";
import { FoundersClubPage } from "./pages/FoundersClubPage";
import { FlowMapPage } from "./pages/FlowMapPage";
import { PrivacyPolicyPage } from "./pages/PrivacyPolicyPage";
import { TermsOfUsePage } from "./pages/TermsOfUsePage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "notice", Component: NoticePage },
      { path: "news", Component: NewsPage },
      { path: "events", Component: EventsPage },
      { path: "events/:id/apply", Component: AuthRoute, children: [{ index: true, Component: EventApplicationPage }] },
      { path: "events/archive", Component: EventArchivePage },
      { path: "resources", Component: AuthRoute, children: [{ index: true, Component: ResourcesPage }] },
      { path: "media", Component: AuthRoute, children: [{ index: true, Component: MediaPage }] },
      { path: "blog", Component: AuthRoute, children: [{ index: true, Component: BlogPage }] },
      { path: "faq", Component: FaqPage },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
      { path: "mypage", Component: MyPage },
      { path: "search", Component: SearchPage },
      { path: "update-password", Component: UpdatePasswordPage },
      { path: "admin", Component: AdminRoute, children: [{ index: true, Component: AdminPage }] },
      { path: "flow-map", Component: AdminRoute, children: [{ index: true, Component: FlowMapPage }] },
      { path: "design-system", Component: AdminRoute, children: [{ index: true, Component: () => null }] },
      { path: "expenses", Component: AuthRoute, children: [{ index: true, Component: ExpensesPage }] },
      { path: "consulting", Component: AuthRoute, children: [{ index: true, Component: ConsultingPage }] },
      { path: "founders-club", Component: AuthRoute, children: [{ index: true, Component: FoundersClubPage }] },
      { path: "privacy-policy", Component: PrivacyPolicyPage },
      { path: "terms-of-use", Component: TermsOfUsePage },
      { path: "post/:id", Component: PostDetailPage },
      { path: "*", Component: NotFoundPage },
    ],
  },
]);
