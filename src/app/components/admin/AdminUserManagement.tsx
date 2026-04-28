import { useState } from "react";
import { useTheme } from "../../ThemeContext";

interface AdminUserManagementProps {
  users: any[];
  currentUsersList: any[];
  currentUsersPage: number;
  setCurrentUsersPage: React.Dispatch<React.SetStateAction<number>>;
  totalUsersPages: number;
  csvLoading: boolean;
  handleSetRole: (id: string, newRole: string) => Promise<void>;
  handleDeleteUser: (id: string) => Promise<void>;
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

const ROLE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  admin:       { label: "관리자",       color: "#EA4335", bg: "#fce8e6" },
  participant: { label: "참여사 담당자", color: "#4377F1", bg: "#eef2ff" },
  user:        { label: "일반 회원",     color: "#888",    bg: "#f1f5f9" },
};

export function AdminUserManagement({
  users,
  currentUsersList,
  currentUsersPage,
  setCurrentUsersPage,
  totalUsersPages,
  csvLoading,
  handleSetRole,
  handleDeleteUser,
  handleCsvUpload
}: AdminUserManagementProps) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState("");

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "#fff";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>회원 관리 ({users.length})</h3>
        <label style={{ padding: "10px 16px", borderRadius: "10px", background: "#4377F1", color: "#fff", fontWeight: 700, cursor: "pointer", display: "inline-block", fontSize: "14px" }}>
          {csvLoading ? "처리 중..." : "CSV 일괄 추가"}
          <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={csvLoading} style={{ display: "none" }} />
        </label>
      </div>

      {/* 검색 */}
      <div style={{ position: "relative" }}>
        <svg style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="이름 또는 이메일로 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "11px 14px 11px 40px", borderRadius: 12, border: `1px solid ${border}`, background: inputBg, color: textMain, fontSize: 14, outline: "none", boxSizing: "border-box" }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", minHeight: "800px" }}>
        {(() => {
          const source = search ? users : currentUsersList;
          const filtered = source.filter(u =>
            (u.name || u.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
            (u.email || "").toLowerCase().includes(search.toLowerCase())
          );
          if (filtered.length === 0) return (
            <div style={{ padding: "60px", textAlign: "center", color: textMuted }}>
              {search ? `'${search}'에 해당하는 회원이 없습니다.` : "회원이 없습니다."}
            </div>
          );
          return filtered.map(user => {
          const cfg = ROLE_CFG[user.role] ?? ROLE_CFG.user;
          return (
            <div key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] sm:gap-0" style={{ background: card, border: `1px solid ${border}`, borderRadius: "20px", padding: "20px 30px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <span style={{ fontSize: "12px", background: isDark ? cfg.color + "33" : cfg.bg, color: cfg.color, padding: "6px 12px", borderRadius: "8px", fontWeight: 700, whiteSpace: "nowrap" }}>
                  {cfg.label}
                </span>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <strong style={{ color: textMain, fontSize: "16px" }}>{user.name || user.user_name || "이름 없음"}</strong>
                  <span style={{ color: textMuted, fontSize: "13px", marginTop: "4px" }}>{user.email || "이메일 없음"}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <select
                  value={user.role ?? "user"}
                  onChange={e => handleSetRole(user.id, e.target.value)}
                  style={{ padding: "9px 12px", borderRadius: "10px", border: `1px solid ${border}`, background: inputBg, color: textMain, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                >
                  <option value="admin">관리자</option>
                  <option value="participant">참여사 담당자</option>
                  <option value="user">일반 회원</option>
                </select>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 700, cursor: "pointer" }}
                >
                  삭제
                </button>
              </div>
            </div>
          );
        });
        })()}
      </div>

      {totalUsersPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          <button onClick={() => setCurrentUsersPage(p => Math.max(1, p - 1))} disabled={currentUsersPage === 1} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${border}`, background: card, color: textMain, cursor: currentUsersPage === 1 ? "not-allowed" : "pointer", fontWeight: 600 }}>이전</button>
          {[...Array(totalUsersPages)].map((_, i) => (
            <button key={i} onClick={() => setCurrentUsersPage(i + 1)} style={{ padding: "8px 16px", borderRadius: "8px", cursor: "pointer", border: currentUsersPage === i + 1 ? `1px solid #4377F1` : `1px solid ${border}`, background: currentUsersPage === i + 1 ? "#4377F1" : card, color: currentUsersPage === i + 1 ? "#fff" : textMain, fontWeight: currentUsersPage === i + 1 ? 800 : 500 }}>{i + 1}</button>
          ))}
          <button onClick={() => setCurrentUsersPage(p => Math.min(totalUsersPages, p + 1))} disabled={currentUsersPage === totalUsersPages} style={{ padding: "8px 14px", borderRadius: "8px", border: `1px solid ${border}`, background: card, color: textMain, cursor: currentUsersPage === totalUsersPages ? "not-allowed" : "pointer", fontWeight: 600 }}>다음</button>
        </div>
      )}
    </div>
  );
}
