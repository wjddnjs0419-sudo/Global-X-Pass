import { Component, type ErrorInfo, type ReactNode } from "react";
import { logError } from "../../lib/errorLogger";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    void logError("error-boundary", error, {
      severity: "high",
      context: { componentStack: info.componentStack },
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            background: "var(--color-bg-surface)",
            color: "var(--color-text-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 40,
          }}
        >
          <div
            style={{
              maxWidth: 420,
              width: "100%",
              background: "var(--color-bg-overlay)",
              border: "1px solid var(--color-glass-border-strong)",
              borderRadius: 20,
              padding: "32px 28px",
              textAlign: "center",
              boxShadow: "0 24px 64px rgba(0,0,0,0.32)",
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
              일시적인 오류가 발생했습니다
            </div>
            <div
              style={{
                fontSize: 13,
                color: "var(--color-text-secondary)",
                lineHeight: 1.7,
                marginBottom: 24,
              }}
            >
              페이지를 다시 불러오거나 홈으로 돌아가 주세요. 문제가 반복되면 관리자에게 문의해 주세요.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={this.handleReload}
                style={{
                  padding: "11px 22px",
                  borderRadius: 10,
                  border: "none",
                  background: "var(--color-accent-blue)",
                  color: "var(--color-on-primary)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                새로고침
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: "11px 22px",
                  borderRadius: 10,
                  border: "1px solid var(--color-glass-border-strong)",
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                홈으로
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
