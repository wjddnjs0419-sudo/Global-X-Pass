import { useState, useEffect, lazy, Suspense } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { useAdmin } from "../../hooks/useAdmin";
import { LAYERS } from "../../lib/layers";

import { HeaderSection } from "../components/HeaderSection";
import { NotificationBell } from "../components/admin/NotificationBell";
import { AdminSidebar } from "../components/admin/AdminSidebar";

const AdminDashboard = lazy(() => import('../components/admin/AdminDashboard'));
const AdminUserManagement = lazy(() => import('../components/admin/AdminUserManagement'));
const AdminPostCreate    = lazy(() => import('../components/admin/AdminPostCreate'));
const AdminPostManage    = lazy(() => import('../components/admin/AdminPostManage'));
const AdminEventManagement = lazy(() => import('../components/admin/AdminEventManagement'));
const AdminConsultingManagement = lazy(() => import('../components/admin/AdminConsultingManagement'));
const AdminOfficeHourManagement = lazy(() => import('../components/admin/AdminOfficeHourManagement'));
const AdminFoundersClubManagement = lazy(() => import('../components/admin/AdminFoundersClubManagement'));
const AdminBlogQueueManagement    = lazy(() => import('../components/admin/AdminBlogQueueManagement'));
const AdminCompanyNewsManagement  = lazy(() => import('../components/admin/AdminCompanyNewsManagement'));
const AdminExternalNewsManagement = lazy(() => import('../components/admin/AdminExternalNewsManagement'));
const AdminBoardManagement        = lazy(() => import('../components/admin/AdminBoardManagement'));

type TabId = "dashboard" | "users" | "create" | "manage" | "boards" | "events" | "consulting" | "office-hours" | "founders" | "blog-queue" | "company-news" | "external-news";

const ADMIN_ACTIVE_TAB_KEY = "gxp_admin_active_tab";
const ADMIN_TABS: TabId[] = ["dashboard", "users", "create", "manage", "boards", "events", "consulting", "office-hours", "founders", "blog-queue", "company-news", "external-news"];

const getStoredAdminTab = (): TabId => {
  if (typeof window === "undefined") return "dashboard";
  const stored = window.sessionStorage.getItem(ADMIN_ACTIVE_TAB_KEY) as TabId | null;
  if (!stored || !ADMIN_TABS.includes(stored)) return "dashboard";
  // 'create' 탭은 editingPost 없이 복원하면 빈 폼이 노출되므로 dashboard로 fallback
  if (stored === "create") return "dashboard";
  return stored;
};

export default function AdminPage() {
  const { isDark } = useTheme();
  const { isAdmin, loading: adminLoading, mfaRequired, mfaEnrolled } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const skColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const SkFallback = ({ rows = 4, h = 72, gap = 16, r = 20 }: { rows?: number; h?: number; gap?: number; r?: number }) => (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: h, borderRadius: r, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );

  const DashSk = () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[18px]">
        {[0,1,2].map(i => (
          <div key={i} style={{ height: 118, borderRadius: 16, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-[18px]">
        <div style={{ height: 300, borderRadius: 16, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 300, borderRadius: 16, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
    </div>
  );

  const [activeTab, setActiveTab] = useState<TabId>(() => getStoredAdminTab());
  const [adminEmail, setAdminEmail] = useState("");
  const [adminId, setAdminId]       = useState("");

  // 탭 간 게시물 편집 상태
  const [editingPost, setEditingPost] = useState<any | null>(null);

  // 자식 컴포넌트 re-fetch 트리거
  const [dashRefreshKey, setDashRefreshKey]   = useState(0);
  const [postsRefreshKey, setPostsRefreshKey] = useState(0);
  const [usersRefreshKey, setUsersRefreshKey] = useState(0);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setAdminEmail(user.email);
      if (user?.id)    setAdminId(user.id);
    });

    // profiles 변경 → 회원 목록 즉시 갱신
    const ch = supabase
      .channel('realtime-profiles-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' },
          () => setUsersRefreshKey(k => k + 1))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  useEffect(() => {
    const editPostId = new URLSearchParams(location.search).get("editPostId");
    if (!editPostId) return;

    let cancelled = false;
    const openEditingPost = async () => {
      const { data } = await supabase.from("posts").select("*").eq("id", editPostId).maybeSingle();
      if (cancelled || !data) return;
      setEditingPost(data);
      window.sessionStorage.setItem(ADMIN_ACTIVE_TAB_KEY, "create");
      setActiveTab("create");
      window.scrollTo({ top: 0, behavior: "smooth" });
      navigate("/admin", { replace: true });
    };

    void openEditingPost();
    return () => { cancelled = true; };
  }, [location.search, navigate]);

  const handleTabChange = (tab: TabId) => {
    window.sessionStorage.setItem(ADMIN_ACTIVE_TAB_KEY, tab);
    setActiveTab(tab);
    if (tab !== "create") setEditingPost(null);
  };

  const handleStartEdit = (post: any) => {
    setEditingPost(post);
    window.sessionStorage.setItem(ADMIN_ACTIVE_TAB_KEY, "create");
    setActiveTab("create");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostSaved = () => {
    setPostsRefreshKey(k => k + 1);
    setDashRefreshKey(k => k + 1);
    setEditingPost(null);
    window.sessionStorage.setItem(ADMIN_ACTIVE_TAB_KEY, "manage");
    setActiveTab("manage");
  };

  const handlePostDeleted = () => {
    setDashRefreshKey(k => k + 1);
  };

  if (adminLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--color-bg-surface)" }}>
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "72px", background: "var(--color-admin-header-backdrop)", zIndex: LAYERS.headerBackdrop }} />
        <HeaderSection isDark={isDark} />
        <div style={{ marginTop: "72px", padding: "clamp(24px, 5vw, 40px) clamp(18px, 4vw, 44px)" }}>
          <SkFallback rows={5} />
        </div>
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;
  if (!mfaEnrolled) { sessionStorage.setItem("mfa_setup_required", "true"); return <Navigate to="/mypage" replace />; }
  if (mfaRequired) return <Navigate to="/login" replace />;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--color-bg-surface)" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "72px", background: "var(--color-admin-header-backdrop)", zIndex: LAYERS.headerBackdrop }} />
      <HeaderSection isDark={isDark} />
      <NotificationBell isDark={isDark} />

      <div className="flex flex-col xl:flex-row" style={{ marginTop: "72px", minHeight: "calc(100vh - 72px)" }}>
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} adminEmail={adminEmail} />

        <main style={{ flex: 1, minWidth: 0, padding: "clamp(24px, 5vw, 40px) clamp(18px, 4vw, 44px) 72px" }}>
          {activeTab === "dashboard" && (
            <Suspense fallback={<DashSk />}>
              <AdminDashboard refreshKey={dashRefreshKey} />
            </Suspense>
          )}

          {activeTab === "users" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 140, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ height: 46, width: "100%", borderRadius: 12, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <SkFallback rows={6} h={78} r={20} gap={12} />
              </div>
            }>
              <AdminUserManagement
                refreshKey={usersRefreshKey}
                adminId={adminId}
              />
            </Suspense>
          )}

          {activeTab === "create" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <div style={{ height: 33, width: 150, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <SkFallback rows={1} h={600} r={16} />
              </div>
            }>
              <AdminPostCreate
                editingPost={editingPost}
                onSaved={handlePostSaved}
                onCancelled={() => { setEditingPost(null); window.sessionStorage.setItem(ADMIN_ACTIVE_TAB_KEY, "manage"); setActiveTab("manage"); }}
              />
            </Suspense>
          )}

          {activeTab === "manage" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 140, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <SkFallback rows={8} h={82} r={20} gap={14} />
              </div>
            }>
              <AdminPostManage
                refreshKey={postsRefreshKey}
                onStartEdit={handleStartEdit}
                onDeleted={handlePostDeleted}
              />
            </Suspense>
          )}

          {activeTab === "boards" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 140, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <SkFallback rows={6} h={92} r={16} gap={12} />
              </div>
            }>
              <AdminBoardManagement />
            </Suspense>
          )}

          {activeTab === "consulting" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 120, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: 100, height: 40, borderRadius: 12, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
                </div>
                <SkFallback rows={5} h={78} r={16} gap={16} />
              </div>
            }>
              <AdminConsultingManagement />
            </Suspense>
          )}

          {activeTab === "office-hours" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 160, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  {[0,1].map(i => <div key={i} style={{ width: 100, height: 40, borderRadius: 12, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
                </div>
                <SkFallback rows={5} h={78} r={16} gap={16} />
              </div>
            }>
              <AdminOfficeHourManagement />
            </Suspense>
          )}

          {activeTab === "events" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 120, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <SkFallback rows={5} h={92} r={16} gap={16} />
              </div>
            }>
              <AdminEventManagement />
            </Suspense>
          )}

          {activeTab === "founders" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 180, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ display: "flex", gap: 8 }}>
                  {[0,1].map(i => <div key={i} style={{ width: 100, height: 40, borderRadius: 12, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
                </div>
                <SkFallback rows={5} h={78} r={16} gap={16} />
              </div>
            }>
              <AdminFoundersClubManagement />
            </Suspense>
          )}

          {activeTab === "blog-queue" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 160, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ display: "flex", gap: 10 }}>
                  {[0,1,2,3].map(i => <div key={i} style={{ width: 90, height: 62, borderRadius: 14, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />)}
                </div>
                <SkFallback rows={6} h={72} r={16} gap={8} />
              </div>
            }>
              <AdminBlogQueueManagement />
            </Suspense>
          )}

          {activeTab === "company-news" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 170, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ height: 82, borderRadius: 16, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <SkFallback rows={6} h={92} r={16} gap={12} />
              </div>
            }>
              <AdminCompanyNewsManagement />
            </Suspense>
          )}

          {activeTab === "external-news" && (
            <Suspense fallback={
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <div style={{ height: 33, width: 170, borderRadius: 8, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <div style={{ height: 220, borderRadius: 16, background: skColor, animation: "pulse 1.5s ease-in-out infinite" }} />
                <SkFallback rows={5} h={92} r={16} gap={12} />
              </div>
            }>
              <AdminExternalNewsManagement />
            </Suspense>
          )}
        </main>
      </div>
    </div>
  );
}
