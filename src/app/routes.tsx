import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { AdminRoute } from "./components/AdminRoute";
import { AuthRoute } from "./components/AuthRoute";
import { WildcardRoute } from "./components/WildcardRoute";
import { AROUND_X_ROUTES } from "./navigation/mainMenu";

const HomePage = lazy(() => import("./components/HomePage").then(m => ({ default: m.HomePage })));
const NoticePage = lazy(() => import("./pages/NoticePage").then(m => ({ default: m.NoticePage })));
const NewsPage = lazy(() => import("./pages/NewsPage").then(m => ({ default: m.NewsPage })));
const CompanyNewsPage = lazy(() => import("./pages/CompanyNewsPage").then(m => ({ default: m.CompanyNewsPage })));
const EventsPage = lazy(() => import("./pages/EventsPage").then(m => ({ default: m.EventsPage })));
const EventApplicationPage = lazy(() => import("./pages/EventApplicationPage").then(m => ({ default: m.EventApplicationPage })));
const EventArchivePage = lazy(() => import("./pages/EventArchivePage").then(m => ({ default: m.EventArchivePage })));
const ResourcesPage = lazy(() => import("./pages/ResourcesPage").then(m => ({ default: m.ResourcesPage })));
const MediaPage = lazy(() => import("./pages/MediaPage").then(m => ({ default: m.MediaPage })));
const FaqPage = lazy(() => import("./pages/FaqPage").then(m => ({ default: m.FaqPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const MyPage = lazy(() => import("./pages/MyPage").then(m => ({ default: m.MyPage })));
const SearchPage = lazy(() => import("./pages/SearchPage").then(m => ({ default: m.SearchPage })));
const UpdatePasswordPage = lazy(() => import("./pages/UpdatePasswordPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const PostDetailPage = lazy(() => import("./pages/PostDetailPage").then(m => ({ default: m.PostDetailPage })));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage").then(m => ({ default: m.ExpensesPage })));
const ConsultingPage = lazy(() => import("./pages/ConsultingPage").then(m => ({ default: m.ConsultingPage })));
const FoundersClubPage = lazy(() => import("./pages/FoundersClubPage").then(m => ({ default: m.FoundersClubPage })));
const CompaniesPage = lazy(() => import("./pages/CompaniesPage").then(m => ({ default: m.CompaniesPage })));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage").then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfUsePage = lazy(() => import("./pages/TermsOfUsePage").then(m => ({ default: m.TermsOfUsePage })));
const AroundXChangguProgramPage = lazy(() => import("./pages/AroundXChangguProgramPage").then(m => ({ default: m.AroundXChangguProgramPage })));
const AroundXRenaultProgramPage = lazy(() => import("./pages/AroundXRenaultProgramPage").then(m => ({ default: m.AroundXRenaultProgramPage })));
const AroundXFincantieriProgramPage = lazy(() => import("./pages/AroundXFincantieriProgramPage").then(m => ({ default: m.AroundXFincantieriProgramPage })));

const toChildRoutePath = (path: string) => path.replace(/^\//, "");

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "notice", Component: NoticePage },
      { path: "news", Component: NewsPage },
      { path: "company-news", Component: CompanyNewsPage },
      { path: "events", Component: EventsPage },
      { path: "events/:id/apply", Component: AuthRoute, children: [{ index: true, Component: EventApplicationPage }] },
      { path: "events/archive", Component: EventArchivePage },
      { path: "resources", Component: ResourcesPage },
      { path: "companies", Component: CompaniesPage },
      { path: "insights", Component: MediaPage },
      { path: "faq", Component: FaqPage },
      { path: "login", Component: LoginPage },
      { path: "signup", Component: SignupPage },
      { path: "mypage", Component: AuthRoute, children: [{ index: true, Component: MyPage }] },
      { path: "search", Component: SearchPage },
      { path: "update-password", Component: UpdatePasswordPage },
      { path: "admin", Component: AdminRoute, children: [{ index: true, Component: AdminPage }] },
      { path: "design-system", Component: AdminRoute, children: [{ index: true, Component: () => null }] },
      { path: "expenses", Component: AuthRoute, children: [{ index: true, Component: ExpensesPage }] },
      { path: "consulting", Component: ConsultingPage },
      { path: "founders-club", Component: FoundersClubPage },
      { path: toChildRoutePath(AROUND_X_ROUTES.changguProgram), Component: AroundXChangguProgramPage },
      { path: toChildRoutePath(AROUND_X_ROUTES.renault), Component: AroundXRenaultProgramPage },
      { path: toChildRoutePath(AROUND_X_ROUTES.fincantieri), Component: AroundXFincantieriProgramPage },
      { path: "privacy-policy", Component: PrivacyPolicyPage },
      { path: "terms-of-use", Component: TermsOfUsePage },
      { path: "post/:id", Component: PostDetailPage },
      { path: "*", Component: WildcardRoute },
    ],
  },
]);
