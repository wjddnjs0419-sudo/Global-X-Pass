import { useState, useEffect } from "react";
import { PageShell } from "../components/PageShell";
import { BoardAccessGate } from "../components/BoardAccessGate";
import { useTheme } from "../ThemeContext";
import { supabase } from "../../lib/supabaseClient";
import { ImmersionPanel } from "../components/ImmersionPanel";
import { OfficeHourPanel } from "../components/OfficeHourPanel";
import { getFilterTabStyle } from "../components/contentListStyles";

type ConsultingMode = "immersion" | "office";

const MODE_TABS: { id: ConsultingMode; label: string }[] = [
  { id: "immersion", label: "온라인 이머젼" },
  { id: "office", label: "오피스아워" },
];

export function ConsultingPage() {
  const { isDark } = useTheme();
  const [mode, setMode] = useState<ConsultingMode>("immersion");
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id ?? null);
      if (!user) return;
      const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
      setIsAdmin(data?.role === "admin");
    });
  }, []);

  return (
    <BoardAccessGate category="consulting">
    <PageShell
      title="1:1 컨설팅 지원"
      subtitle="전문가와 직접 예약하는 온라인 이머젼, 월별로 매칭되는 오피스아워 중 선택하세요"
      accentColor="var(--color-accent-blue)"
    >
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 80 }}>
        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
          {MODE_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setMode(tab.id)}
              style={getFilterTabStyle(isDark, mode === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === "immersion" ? <ImmersionPanel /> : <OfficeHourPanel userId={userId} isAdmin={isAdmin} />}
      </div>
    </PageShell>
    </BoardAccessGate>
  );
}
