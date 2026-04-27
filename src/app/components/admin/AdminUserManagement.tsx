import { useTheme } from "../../ThemeContext";

interface AdminUserManagementProps {
  users: any[];
  currentUsersList: any[];
  currentUsersPage: number;
  setCurrentUsersPage: React.Dispatch<React.SetStateAction<number>>;
  totalUsersPages: number;
  csvLoading: boolean;
  handleGrantAdmin: (id: string, currentRole: string) => Promise<void>;
  handleDeleteUser: (id: string) => Promise<void>;
  handleCsvUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function AdminUserManagement({
  users,
  currentUsersList,
  currentUsersPage,
  setCurrentUsersPage,
  totalUsersPages,
  csvLoading,
  handleGrantAdmin,
  handleDeleteUser,
  handleCsvUpload
}: AdminUserManagementProps) {
  const { isDark } = useTheme();

  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "22px", fontWeight: 800, color: textMain }}>회원 관리 ({users.length})</h3>
        <div style={{ display: "flex", gap: "12px" }}>
          <label style={{
            padding: "10px 16px", borderRadius: "10px", background: "#4377F1", color: "#fff",
            fontWeight: 700, cursor: "pointer", display: "inline-block", fontSize: "14px"
          }}>
            {csvLoading ? "처리 중..." : "CSV 일괄 추가"}
            <input type="file" accept=".csv" onChange={handleCsvUpload} disabled={csvLoading} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px", minHeight: "800px" }}>
        {currentUsersList.length === 0 ? (
           <div style={{ padding: "60px", textAlign: "center", color: textMuted }}>회원이 없습니다.</div>
        ) : (
           currentUsersList.map(user => (
             <div key={user.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[16px] sm:gap-0" style={{ background: card, border: `1px solid ${border}`, borderRadius: "20px", padding: "20px 30px" }}>
               <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                 <span style={{ fontSize: "12px", background: user.role === 'admin' ? "#fee2e2" : "#eef2ff", color: user.role === 'admin' ? "#ef4444" : "#4377F1", padding: "6px 10px", borderRadius: "8px", fontWeight: 700 }}>
                   {user.role === 'admin' ? '관리자' : '일반'}
                 </span>
                 <div style={{ display: "flex", flexDirection: "column" }}>
                   <strong style={{ color: textMain, fontSize: "16px" }}>{user.name || user.user_name || "이름 없음"}</strong>
                   <span style={{ color: textMuted, fontSize: "13px", marginTop: "4px" }}>{user.email || "이메일 없음"}</span>
                 </div>
               </div>
               <div style={{ display: "flex", gap: "10px" }}>
                 <button 
                   onClick={() => handleGrantAdmin(user.id, user.role)} 
                   style={{ padding: "10px 18px", borderRadius: "10px", border: `1px solid ${border}`, background: "none", color: "#4377F1", fontWeight: 700, cursor: "pointer" }}
                 >
                   {user.role === 'admin' ? '권한 해제' : '관리자 부여'}
                 </button>
                 <button 
                   onClick={() => handleDeleteUser(user.id)} 
                   style={{ padding: "10px 18px", borderRadius: "10px", border: "none", background: "#fee2e2", color: "#ef4444", fontWeight: 700, cursor: "pointer" }}
                 >
                   삭제
                 </button>
               </div>
             </div>
           ))
        )}
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
