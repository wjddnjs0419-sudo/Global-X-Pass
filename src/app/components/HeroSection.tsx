import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
// 💡 언어 상태 관리를 위한 Context 추가 (경로가 다를 경우 알맞게 수정해주세요!)
import { useLanguage } from "../LanguageContext"; 

// ─── Star Field Canvas ────────────────────────────────────────────────────────
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const totalStars = 220;
    const stars = Array.from({ length: totalStars }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: i < 160 ? Math.random() * 0.8 + 0.3 : i < 200 ? Math.random() * 1.2 + 0.8 : Math.random() * 1.8 + 1.2,
      baseOpacity: Math.random() * 0.65 + 0.2,
      twinkleSpeed: Math.random() * 0.8 + 0.3,
      phase: Math.random() * Math.PI * 2,
      isBlue: Math.random() < 0.15,
    }));

    let shootingStar: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number } | null = null;
    let nextShoot = Date.now() + 3000 + Math.random() * 5000;

    let t = 0;

    const draw = () => {
      if (!canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.016;

      stars.forEach((star) => {
        const opacity = star.baseOpacity * (0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.phase));
        const x = star.x * canvas.width;
        const y = star.y * canvas.height;

        if (star.r > 1.2) {
          const grad = ctx.createRadialGradient(x, y, 0, x, y, star.r * 4);
          const color = star.isBlue ? `rgba(100,160,255,` : `rgba(200,220,255,`;
          grad.addColorStop(0, `${color}${opacity * 0.5})`);
          grad.addColorStop(1, `${color}0)`);
          ctx.beginPath();
          ctx.arc(x, y, star.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = star.isBlue ? `rgba(160,200,255,${opacity})` : `rgba(255,255,255,${opacity})`;
        ctx.fill();
      });

      const now = Date.now();
      if (now >= nextShoot && !shootingStar) {
        const startX = Math.random() * canvas.width * 0.6;
        const startY = Math.random() * canvas.height * 0.4;
        shootingStar = {
          x: startX, y: startY,
          vx: 4 + Math.random() * 4,
          vy: 2 + Math.random() * 3,
          life: 0,
          maxLife: 60 + Math.random() * 40,
        };
        nextShoot = now + 4000 + Math.random() * 6000;
      }

      if (shootingStar) {
        const progress = shootingStar.life / shootingStar.maxLife;
        const opacity = progress < 0.2 ? progress / 0.2 : 1 - (progress - 0.2) / 0.8;
        const tailLen = 80 + shootingStar.vx * 8;
        const grad = ctx.createLinearGradient(
          shootingStar.x - shootingStar.vx * tailLen / shootingStar.vx,
          shootingStar.y - shootingStar.vy * tailLen / shootingStar.vx,
          shootingStar.x, shootingStar.y
        );
        grad.addColorStop(0, `rgba(255,255,255,0)`);
        grad.addColorStop(1, `rgba(255,255,255,${opacity * 0.9})`);
        ctx.beginPath();
        ctx.moveTo(shootingStar.x - (shootingStar.vx / shootingStar.vx) * tailLen, shootingStar.y - (shootingStar.vy / shootingStar.vx) * tailLen);
        ctx.lineTo(shootingStar.x, shootingStar.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(shootingStar.x, shootingStar.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();

        shootingStar.x += shootingStar.vx;
        shootingStar.y += shootingStar.vy;
        shootingStar.life++;
        if (shootingStar.life >= shootingStar.maxLife) shootingStar = null;
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1 }} />
  );
}

// ─── Node Data (💡 다국어 지원 구조로 변경) ──────────────────────────────────
const nodeData = [
  {
    id: "1", index: 0, 
    label: { ko: "공지사항", en: "Notice" },
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
      </svg>
    ),
    card: { 
      badge: { ko: "NOTICE", en: "NOTICE" }, 
      badgeSub: { ko: "필독", en: "Must Read" }, 
      title: { ko: "주요 공지사항", en: "Key Notices" }, 
      desc: { ko: "프로그램 운영 및 지원금 관련\n중요 안내사항을 확인하세요.", en: "Check important announcements\nregarding program operations and funding." }, 
      href: "/notice" 
    },
  },
  {
    id: "2", index: 1, 
    label: { ko: "행사 소식", en: "Event News" },
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    card: { 
      badge: { ko: "EVENT", en: "EVENT" }, 
      badgeSub: { ko: "일정", en: "Schedule" }, 
      title: { ko: "네트워킹 데이 및 세미나", en: "Networking Day & Seminars" }, 
      desc: { ko: "오프라인 밋업 및 전문가 특강\n일정을 안내해 드립니다.", en: "We provide schedules for\noffline meetups and expert lectures." }, 
      href: "/events" 
    },
  },
  {
    id: "3", index: 2, 
    label: { ko: "최신게시물", en: "Latest Posts" },
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    card: { 
      badge: { ko: "UPDATES", en: "UPDATES" }, 
      badgeSub: { ko: "New", en: "New" }, 
      title: { ko: "커뮤니티 소식", en: "Community News" }, 
      desc: { ko: "창구 프로그램 동문 기업들의\n최신 근황과 자유로운 소통 공간입니다.", en: "A space for the latest updates\nand free communication among alumni companies." }, 
      href: "#community-section" 
    },
  },
  {
    id: "4", index: 3, 
    label: { ko: "자료실", en: "Resources" },
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    card: { 
      badge: { ko: "RESOURCE", en: "RESOURCE" }, 
      badgeSub: { ko: "다운로드", en: "Download" }, 
      title: { ko: "가이드 및 VOD", en: "Guides & VOD" }, 
      desc: { ko: "IR 템플릿, 교육 영상(VOD) 등\n사업 성장에 필요한 자료 모음입니다.", en: "A collection of materials necessary for business growth,\nsuch as IR templates and educational videos." }, 
      href: "/resources" 
    },
  },
  {
    id: "5", index: 4, 
    label: { ko: "뉴스레터", en: "Newsletter" },
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: "100%", height: "100%" }}>
        <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
      </svg>
    ),
    card: { 
      badge: { ko: "INSIGHT", en: "INSIGHT" }, 
      badgeSub: { ko: "구독", en: "Subscribe" }, 
      title: { ko: "주간 마켓 트렌드", en: "Weekly Market Trends" }, 
      desc: { ko: "매주 발행되는 글로벌 시장 동향\n및 테크 인사이트 레포트입니다.", en: "Weekly reports on global market trends\nand tech insights." }, 
      href: "/news" 
    },
  },
];

// ─── Main Hero Section ────────────────────────────────────────────────────────
export function HeroSection() {
  const navigate = useNavigate();
  const { lang } = useLanguage(); // 💡 언어 상태 가져오기

  const [expanded, setExpanded] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  const angleRef = useRef(0);
  const isAutoRotatingRef = useRef(true);
  const animFrameRef = useRef<number>(0);

  // Responsive sizing
  useEffect(() => {
    const onResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scale =
    windowWidth < 400 ? 0.42
    : windowWidth < 540 ? 0.50
    : windowWidth < 768 ? 0.58
    : windowWidth < 1024 ? 0.74
    : 1;

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const SCENE = 800 * scale;
  const INNER_ORBIT = 560 * scale;
  const OUTER_ORBIT = 780 * scale;
  const CORE = 120 * scale;
  const NODE = 84 * scale;
  const ICON = 34 * scale;
  const RADIUS = 280 * scale;

  // Orbit animation
  const animate = useCallback(() => {
    if (isAutoRotatingRef.current) angleRef.current += 0.1;
    const newPos: Record<string, { x: number; y: number }> = {};
    nodeData.forEach((node) => {
      const a = (angleRef.current + (node.index / nodeData.length) * 360) * (Math.PI / 180);
      newPos[node.id] = { x: RADIUS * Math.cos(a), y: RADIUS * Math.sin(a) };
    });
    setNodePositions({ ...newPos });
    animFrameRef.current = requestAnimationFrame(animate);
  }, [RADIUS]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate]);

  const handleCoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => {
      const next = !prev;
      if (!next) { setActiveNode(null); isAutoRotatingRef.current = true; }
      else { isAutoRotatingRef.current = false; }
      return next;
    });
  };

  const handleNodeClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setActiveNode((prev) => {
      if (prev === id) { isAutoRotatingRef.current = !expanded; return null; }
      isAutoRotatingRef.current = false;
      return id;
    });
  };

  const handleBgClick = () => {
    setActiveNode(null);
    isAutoRotatingRef.current = !expanded;
  };

  const activeNodeData = nodeData.find((n) => n.id === activeNode) ?? null;

  const sceneTransform = expanded
    ? isMobile || isTablet
      ? "translateY(-18%)"
      : "translateX(-22%)"
    : "none";

  const infoPanelStyle: React.CSSProperties = isMobile || isTablet
    ? {
        position: "absolute",
        bottom: expanded ? "36px" : "-300px",
        left: "50%",
        transform: "translateX(-50%)",
        width: isMobile ? "90%" : "70%",
        opacity: expanded ? 1 : 0,
        textAlign: "center",
      }
    : {
        position: "absolute",
        right: expanded ? "8%" : "-520px",
        top: "50%",
        transform: "translateY(-50%)",
        width: "400px",
        opacity: expanded ? 1 : 0,
        textAlign: "left",
      };

  // 💡 정보 패널 다국어 세팅
  const INFO_CONTENT = {
    label: { ko: "PROGRAM INFO", en: "PROGRAM INFO" },
    title: { ko: "구글 창구 프로그램", en: "Google ChangGoo Program" },
    desc: {
      ko: (
        <>
          넥스트챌린지와 구글플레이, 중소벤처기업부, 창업진흥원이 공동 운영하는{" "}
          <strong style={{ color: "#fff" }}>대한민국 대표 앱·게임 스타트업 액셀러레이팅 프로그램</strong>입니다. 
          잠재력 있는 기업을 발굴하여 글로벌 성공 스토리를 함께 만들어가는데 기여하겠습니다.
        </>
      ),
      en: (
        <>
          It is <strong style={{ color: "#fff" }}>Korea's representative app/game startup accelerating program</strong> co-operated by Next Challenge, Google Play, the Ministry of SMEs and Startups, and KISED. 
          We will contribute to creating global success stories together by discovering companies with potential.
        </>
      )
    },
    hint: {
      ko: "중앙 코어를 클릭해 프로그램 정보 보기",
      en: "Click the central core to view program info"
    }
  };

  return (
    <>
      <style>{`
        @keyframes spinLight { 100% { transform: rotate(360deg); } }
        @keyframes coreGlow {
          0%   { transform: scale(0.97); opacity: 0.5; }
          100% { transform: scale(1.03); opacity: 1; box-shadow: 0 0 32px rgba(66,133,244,0.7); }
        }
        @keyframes corePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(66,133,244,0.0), inset 0 0 40px rgba(66,133,244,0.08); }
          50%       { box-shadow: 0 0 40px 12px rgba(66,133,244,0.18), inset 0 0 40px rgba(66,133,244,0.18); }
        }
        .orbit-light-inner {
          position: absolute; border-radius: 50%; pointer-events: none;
          animation: spinLight 12s linear infinite;
        }
        .orbit-light-outer {
          position: absolute; border-radius: 50%; pointer-events: none;
          animation: spinLight 22s linear infinite reverse;
        }
        .orbit-light-inner::before, .orbit-light-outer::before {
          content: ''; position: absolute; top: 0; left: 50%;
          transform: translate(-50%, -50%);
          width: 8px; height: 8px; border-radius: 50%; background: #fff;
          box-shadow: 0 0 15px 5px rgba(255,255,255,0.9), 0 0 30px 10px rgba(66,133,244,0.6);
        }
        .core-ring { animation: corePulse 3s ease-in-out infinite; }
        .core-ring::after {
          content: ''; position: absolute; top: -6%; left: -6%;
          width: 112%; height: 112%; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.45);
          box-shadow: 0 0 20px rgba(66,133,244,0.5);
          animation: coreGlow 2s ease-in-out infinite alternate;
          pointer-events: none;
        }
        .node-card-mobile {
          position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
          width: calc(100% - 48px); max-width: 400px; z-index: 300;
        }
      `}</style>

      <div
        onClick={handleBgClick}
        style={{
          position: "relative",
          width: "100vw", maxWidth: "100%", height: "95vh", minHeight: isMobile ? "700px" : "900px",
          background: "radial-gradient(circle at 20% 30%, rgba(40,20,80,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(20,40,80,0.3) 0%, transparent 50%), radial-gradient(circle at center, #16223a 0%, #0c1221 60%, #000 100%)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "'Pretendard', -apple-system, sans-serif", left: "50%", transform: "translateX(-50%)",
        }}
      >
        <StarField />

        <div style={{ position: "relative", width: `${SCENE}px`, height: `${SCENE}px`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "transform 1.2s cubic-bezier(0.19, 1, 0.22, 1)", transform: sceneTransform, zIndex: 10 }}>
          <div className="core-ring" onClick={handleCoreClick} style={{ position: "relative", zIndex: 100, width: `${CORE}px`, height: `${CORE}px`, cursor: "pointer", borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, rgba(66,133,244,0.25), rgba(10,15,30,0.8))", border: "1.5px solid rgba(255,255,255,0.18)", backdropFilter: "blur(8px)" }} />

          <div style={{ position: "absolute", width: `${INNER_ORBIT}px`, height: `${INNER_ORBIT}px`, border: "1px dashed rgba(255,255,255,0.13)", borderRadius: "50%", pointerEvents: "none" }} />
          <div className="orbit-light-inner" style={{ width: `${INNER_ORBIT}px`, height: `${INNER_ORBIT}px` }} />

          <div style={{ position: "absolute", width: `${OUTER_ORBIT}px`, height: `${OUTER_ORBIT}px`, border: "1px solid rgba(255,255,255,0.05)", borderRadius: "50%", pointerEvents: "none" }} />
          <div className="orbit-light-outer" style={{ width: `${OUTER_ORBIT}px`, height: `${OUTER_ORBIT}px` }} />

          {nodeData.map((node) => {
            const pos = nodePositions[node.id];
            const isActive = activeNode === node.id;
            return (
              <div key={node.id} onClick={(e) => handleNodeClick(e, node.id)} style={{ position: "absolute", width: `${NODE}px`, height: `${NODE}px`, left: pos ? `calc(50% + ${pos.x}px - ${NODE / 2}px)` : `calc(50% - ${NODE / 2}px)`, top: pos ? `calc(50% + ${pos.y}px - ${NODE / 2}px)` : `calc(50% - ${NODE / 2}px)`, cursor: "pointer", zIndex: isActive ? 150 : 20 }}>
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: isActive ? "rgba(255,255,255,0.15)" : "rgba(25,28,38,0.85)", border: isActive ? "1.5px solid #fff" : "1px solid rgba(255,255,255,0.22)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(6px)", boxShadow: isActive ? "0 0 28px rgba(255,255,255,0.35)" : "none", transform: isActive ? "scale(1.18)" : "scale(1)", transition: "all 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)" }}>
                  <span style={{ width: `${ICON}px`, height: `${ICON}px`, color: "#fff", opacity: isActive ? 1 : 0.82, display: "flex", alignItems: "center", justifyContent: "center" }}>{node.icon}</span>
                </div>
                
                {/* 💡 노드 라벨 다국어 적용 */}
                <span style={{ position: "absolute", top: `${NODE + 12}px`, left: "50%", transform: "translateX(-50%)", color: "#e2e2e3", fontSize: `${Math.max(11, 16 * scale)}px`, whiteSpace: "nowrap", fontWeight: 700, letterSpacing: "-0.02em", textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
                  {node.label[lang as "ko" | "en"]}
                </span>

                {!isMobile && (
                  <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", top: "50%", left: `calc(100% + ${16 * scale}px)`, transform: isActive ? "translateY(-50%) translateX(0)" : "translateY(-50%) translateX(-15px)", width: `${Math.min(300, windowWidth * 0.28)}px`, background: "rgba(14,18,28,0.82)", border: "1px solid rgba(255,255,255,0.14)", padding: `${22 * scale}px`, borderRadius: "20px", opacity: isActive ? 1 : 0, pointerEvents: isActive ? "auto" : "none", transition: "all 0.4s ease", backdropFilter: "blur(24px)", textAlign: "left", zIndex: 200, boxShadow: "0 24px 48px rgba(0,0,0,0.65)", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <CardContent node={node} scale={scale} onNavigate={navigate} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isMobile && activeNodeData && (
          <div className="node-card-mobile" onClick={(e) => e.stopPropagation()} style={{ background: "rgba(14,18,28,0.88)", border: "1px solid rgba(255,255,255,0.14)", padding: "22px", borderRadius: "20px", backdropFilter: "blur(24px)", boxShadow: "0 24px 48px rgba(0,0,0,0.7)", display: "flex", flexDirection: "column", gap: "10px", animation: "fadeSlideUp 0.35s ease forwards" }}>
            <CardContent node={activeNodeData} scale={1} onNavigate={navigate} />
          </div>
        )}

        <div onClick={(e) => e.stopPropagation()} style={{ ...infoPanelStyle, transition: "all 1.2s cubic-bezier(0.19, 1, 0.22, 1)", zIndex: 20, pointerEvents: expanded ? "auto" : "none" }}>
          {/* 💡 중앙 정보 패널 다국어 적용 */}
          <div style={{ fontSize: `${Math.max(11, 13 * scale)}px`, color: "#4285F4", fontWeight: 800, letterSpacing: "2px", marginBottom: "12px" }}>
            {INFO_CONTENT.label[lang as "ko" | "en"]}
          </div>
          <h2 style={{ fontSize: `${Math.max(24, 42 * scale)}px`, color: "#fff", fontWeight: 800, margin: "0 0 20px 0", letterSpacing: "-1.5px", lineHeight: 1.2 }}>
            {INFO_CONTENT.title[lang as "ko" | "en"]}
          </h2>
          <p style={{ fontSize: `${Math.max(14, 17 * scale)}px`, color: "rgba(255,255,255,0.8)", lineHeight: 1.8, wordBreak: "keep-all", margin: 0 }}>
            {INFO_CONTENT.desc[lang as "ko" | "en"]}
          </p>
        </div>

        {!expanded && (
          <div style={{ position: "absolute", bottom: isMobile ? "28px" : "40px", left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.35)", fontSize: `${Math.max(11, 13 * scale)}px`, letterSpacing: "0.05em", whiteSpace: "nowrap", zIndex: 5, fontWeight: 500 }}>
            {/* 💡 하단 힌트 텍스트 다국어 적용 */}
            {INFO_CONTENT.hint[lang as "ko" | "en"]}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Card Content ─────────────────────────────────────────────────────────────
function CardContent({ node, scale, onNavigate }: { node: typeof nodeData[0]; scale: number; onNavigate: (to: string) => void }) {
  const { lang } = useLanguage(); // 💡 카드 내부에서도 언어 상태 가져오기
  const isEn = lang === "en";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "11px", background: "#4285F4", color: "#fff", padding: "4px 10px", borderRadius: "6px", fontWeight: 800, letterSpacing: "0.05em" }}>
          {/* 💡 배지 텍스트 */}
          {node.card.badge[isEn ? "en" : "ko"]}
        </span>
        <small style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", fontFamily: "monospace", fontWeight: 600 }}>
          {/* 💡 배지 서브 텍스트 */}
          {node.card.badgeSub[isEn ? "en" : "ko"]}
        </small>
      </div>
      <h5 style={{ margin: 0, color: "#fff", fontSize: `${Math.max(17, 21 * scale)}px`, fontWeight: 800, lineHeight: 1.3 }}>
        {/* 💡 타이틀 */}
        {node.card.title[isEn ? "en" : "ko"]}
      </h5>
      <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: `${Math.max(13, 15 * scale)}px`, lineHeight: 1.65, wordBreak: "keep-all", whiteSpace: "pre-line" }}>
        {/* 💡 상세 설명 */}
        {node.card.desc[isEn ? "en" : "ko"]}
      </p>
      <div
        onClick={() => {
          const href = node.card.href;
          if (href.startsWith("#")) {
            const el = document.getElementById(href.slice(1));
            if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            onNavigate(href);
          }
        }}
        style={{ alignSelf: "flex-end", marginTop: "6px", color: "#fff", fontWeight: 800, fontSize: "14px", textDecoration: "underline", cursor: "pointer", opacity: 0.9, transition: "opacity 0.2s" }}
      >
        {/* 💡 자세히 보기 버튼 텍스트 */}
        {isEn ? "View Details →" : "자세히 보기 →"}
      </div>
    </>
  );
}