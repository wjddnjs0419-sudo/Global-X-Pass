import { useState, useEffect, lazy, Suspense } from "react";
import { Navigate } from "react-router";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { useAdmin } from "../../hooks/useAdmin";

import { HeaderSection } from "../components/HeaderSection";
import { NotificationBell } from "../components/admin/NotificationBell";
import { AdminSidebar } from "../components/admin/AdminSidebar";
import { AdminDashboard } from "../components/admin/AdminDashboard";
import { AdminPostManage } from "../components/admin/AdminPostManage";
import { AdminConsultingManagement } from "../components/admin/AdminConsultingManagement";
import { AdminFoundersClubManagement } from "../components/admin/AdminFoundersClubManagement";

const AdminPostCreate    = lazy(() => import('../components/admin/AdminPostCreate'));
const AdminUserManagement = lazy(() => import('../components/admin/AdminUserManagement'));

type TabId = "dashboard" | "users" | "create" | "manage" | "consulting" | "founders";

const SkFallback = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} style={{ height: 72, borderRadius: 20, background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
    ))}
  </div>
);

export default function AdminPage() {
  const { isDark } = useTheme();
  const { isAdmin, loading: adminLoading } = useAdmin();

  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
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

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    if (tab !== "create") setEditingPost(null);
  };

  const handleStartEdit = (post: any) => {
    setEditingPost(post);
    setActiveTab("create");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePostSaved = () => {
    setPostsRefreshKey(k => k + 1);
    setDashRefreshKey(k => k + 1);
    setEditingPost(null);
    setActiveTab("manage");
  };

  const handlePostDeleted = () => {
    setDashRefreshKey(k => k + 1);
  };

  if (adminLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: isDark ? "#0a1020" : "#F7F8FC" }}>
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: "72px", background: "#0a1020", zIndex: 999 }} />
      <HeaderSection isDark={isDark} />
      <NotificationBell isDark={isDark} />

      <div style={{ display: "flex", marginTop: "72px", minHeight: "calc(100vh - 72px)" }}>
        <AdminSidebar activeTab={activeTab} onTabChange={handleTabChange} adminEmail={adminEmail} />

        <main style={{ flex: 1, minWidth: 0, padding: "48px 48px 80px" }}>
          {activeTab === "dashboard" && (
            <AdminDashboard refreshKey={dashRefreshKey} />
          )}

          {activeTab === "users" && (
            <Suspense fallback={<SkFallback />}>
              <AdminUserManagement
                refreshKey={usersRefreshKey}
                adminId={adminId}
                adminEmail={adminEmail}
              />
            </Suspense>
          )}

          {activeTab === "create" && (
            <Suspense fallback={<SkFallback />}>
              <AdminPostCreate
                editingPost={editingPost}
                onSaved={handlePostSaved}
                onCancelled={() => { setEditingPost(null); setActiveTab("manage"); }}
              />
            </Suspense>
          )}

          {activeTab === "manage" && (
            <AdminPostManage
              refreshKey={postsRefreshKey}
              onStartEdit={handleStartEdit}
              onDeleted={handlePostDeleted}
            />
          )}

          {activeTab === "consulting" && <AdminConsultingManagement />}
          {activeTab === "founders"   && <AdminFoundersClubManagement />}
        </main>
      </div>
    </div>
  );
}
