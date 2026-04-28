import { useTheme } from "../ThemeContext";
import { HeaderSection } from "../components/HeaderSection";
import { AdminFlowMap } from "../components/admin/AdminFlowMap";

export function FlowMapPage() {
  const { isDark } = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: isDark ? "#0a1020" : "#F7F8FC", width: "100%" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "72px", background: "#0a1020", zIndex: 999 }} />
      <HeaderSection isDark={isDark} />
      <main style={{ flex: 1, width: "100%", maxWidth: "1100px", margin: "0 auto", padding: "120px 20px 100px 20px" }}>
        <AdminFlowMap />
      </main>
    </div>
  );
}
