import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { getSectionTheme } from "../utils/sectionTheme";
import { supabase } from "../../lib/supabaseClient";
import { cleanText } from "../../utils/text";
import type { Post } from "../../lib/types";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

interface NewsletterSectionProps { isDark?: boolean; }

export function NewsletterSection({ isDark = false }: NewsletterSectionProps) {
  const th = getSectionTheme(isDark);
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState("");
  const [newsList, setNewsList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.45)";
  const accentColor = "#FBBC05";

  useEffect(() => {
    const fetchNews = async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("category", "news")
        .order("created_at", { ascending: false })
        .limit(4);
      setNewsList((data as Post[]) || []);
      setLoading(false);
    };
    fetchNews();
  }, []);

  const handleSubscribe = async () => {
    const trimmed = email.trim();
    if (!trimmed.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setSubscribeError("올바른 이메일 주소를 입력해주세요.");
      return;
    }

    setSubscribing(true);
    setSubscribeError("");

    const { error } = await supabase
      .from("subscribers")
      .insert({ email: trimmed });

    setSubscribing(false);

    if (error) {
      if (error.code === "23505") {
        setSubscribeError("이미 구독 중인 이메일입니다.");
      } else {
        setSubscribeError("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      return;
    }

    setSubscribed(true);
    setEmail("");
  };

  return (
    <section style={{
      position: "relative", width: "100vw", maxWidth: "100%",
      left: "50%", transform: "translateX(-50%)",
      padding: "clamp(60px, 10vw, 100px) clamp(20px, 5vw, 40px) clamp(72px, 12vw, 120px)",
      background: isDark
        ? "radial-gradient(circle at 20% 50%, rgba(251,188,5,0.06) 0%, transparent 50%), linear-gradient(180deg, #0a1020 0%, #070d1a 100%)"
        : "radial-gradient(circle at 20% 50%, rgba(251,188,5,0.04) 0%, transparent 50%), linear-gradient(180deg, #ffffff 0%, #F4F6FB 100%)",
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      boxSizing: "border-box", overflow: "hidden",
      transition: "background 0.4s ease",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: `radial-gradient(${th.dotGrid} 1px, transparent 1px)`, backgroundSize: "36px 36px" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1280px", margin: "0 auto" }}>
        <div className="grid grid-cols-1 min-[900px]:grid-cols-2 gap-[40px] min-[900px]:gap-[60px] items-start">

          <div>
            <h2 style={{ color: th.headingColor, fontSize: "clamp(24px,3vw,42px)", fontWeight: 800, margin: "0 0 16px", letterSpacing: "-1.5px", lineHeight: 1.15 }}>
              주간 마켓 트렌드<br />뉴스레터
            </h2>
            <p style={{ color: th.subText, fontSize: "15px", margin: "0 0 32px", lineHeight: 1.75 }}>
              매주 월요일, 글로벌 앱·게임 시장 동향과 창구 프로그램 소식을 정리해 보내드립니다. 현재 <strong style={{ color: th.headingColor }}>2,840명</strong>이 구독 중입니다.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
              {[
                { icon: "📊", text: "동남아·북미·유럽 주간 앱 시장 데이터" },
                { icon: "🎙️", text: "Google 전문가 & 창업자 인터뷰" },
                { icon: "📥", text: "회원 전용 PDF 리포트 무료 제공" },
                { icon: "🚀", text: "창구 프로그램 신규 공지 최우선 안내" },
              ].map((b) => (
                <div key={b.text} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "16px" }}>{b.icon}</span>
                  <span style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 500 }}>{b.text}</span>
                </div>
              ))}
            </div>

            {!subscribed ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="email"
                    placeholder="이메일 주소를 입력하세요"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setSubscribeError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                    style={{ flex: 1, background: th.inputBg, border: `1px solid ${subscribeError ? "#EA4335" : th.inputBorder}`, borderRadius: "12px", padding: "13px 16px", fontSize: "14px", color: th.inputText, outline: "none", fontFamily: "'Pretendard', sans-serif", transition: "border-color 0.2s" }}
                  />
                  <Button
                    onClick={handleSubscribe}
                    disabled={subscribing}
                    shape="pill"
                    className="bg-gradient-to-r from-[#FBBC05] to-[#FFEE56] hover:brightness-110 text-black border-none shadow-[0_4px_14px_rgba(251,188,5,0.35)] px-6 disabled:opacity-60"
                  >
                    {subscribing ? "처리 중..." : "구독하기"}
                  </Button>
                </div>
                {subscribeError ? (
                  <p style={{ color: "#EA4335", fontSize: "12px", margin: 0, lineHeight: 1.5 }}>{subscribeError}</p>
                ) : (
                  <p style={{ color: textMuted, fontSize: "12px", margin: 0, lineHeight: 1.5 }}>
                    무료 구독이며, 언제든지 수신 거부할 수 있습니다.
                  </p>
                )}
              </div>
            ) : (
              <div style={{ background: "rgba(24,163,67,0.1)", border: "1px solid rgba(24,163,67,0.25)", borderRadius: "14px", padding: "20px 24px", display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "24px" }}>🎉</span>
                <div>
                  <div style={{ color: "#18A343", fontSize: "15px", fontWeight: 800, marginBottom: "4px" }}>구독 완료!</div>
                  <div style={{ color: th.subText, fontSize: "13px" }}>다음 월요일 인사이트 레포트를 가장 먼저 받아보세요.</div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <span style={{ color: textMuted, fontSize: "11px", fontWeight: 800, letterSpacing: "1.5px" }}>최근 발행호</span>
              <Button variant="outline" shape="pill" size="sm" asChild className={isDark ? "border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10" : "border-yellow-500/20 text-yellow-600 hover:bg-yellow-50"}>
                <Link to="/news">전체보기 →</Link>
              </Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {loading ? (
                <div style={{ color: textMuted, fontSize: "13px" }}>발행호를 불러오는 중...</div>
              ) : newsList.map((news) => (
                <div
                  key={news.id}
                  onClick={() => navigate(`/post/${news.id}`)}
                  style={{ background: th.cardBg, border: `1px solid ${th.cardBorder}`, borderRadius: "16px", padding: "20px 22px", boxShadow: th.cardShadow, cursor: "pointer", transition: "transform 0.25s ease, box-shadow 0.25s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = th.cardShadow; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <span style={{ color: textMuted, fontSize: "12px", fontWeight: 700 }}>NEW</span>
                    <span style={{ color: textMuted, fontSize: "11px" }}>·</span>
                    <Badge variant="blue" shape="pill" showDot>인사이트</Badge>
                    <span style={{ color: textMuted, fontSize: "11px", marginLeft: "auto" }}>{new Date(news.created_at).toLocaleDateString()}</span>
                  </div>
                  <div style={{ color: th.itemTitle, fontSize: "14px", fontWeight: 700, marginBottom: "6px", lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {news.title}
                  </div>
                  <div style={{ color: th.itemDesc, fontSize: "12px", lineHeight: 1.55, marginBottom: "10px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {cleanText(news.content)}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: accentColor }}>
                    <span style={{ fontSize: "12px", fontWeight: 700 }}>읽기 (5분)</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: "80px", display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${th.dividerColor})` }} />
          <span style={{ color: th.footerText, fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
            NCF × GOOGLE PLAY × MSS × KISED
          </span>
          <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${th.dividerColor})` }} />
        </div>
      </div>
    </section>
  );
}
