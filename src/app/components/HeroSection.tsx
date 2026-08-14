import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useLanguage } from "../LanguageContext";

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
    const googleColors = ["66,133,244", "234,67,53", "251,188,5", "52,168,83"];

    const stars = Array.from({ length: totalStars }, (_, i) => ({
      x: Math.random(),
      y: Math.random(),
      r: i < 160 ? Math.random() * 0.8 + 0.3 : i < 200 ? Math.random() * 1.2 + 0.8 : Math.random() * 1.8 + 1.2,
      baseOpacity: Math.random() * 0.65 + 0.2,
      twinkleSpeed: Math.random() * 0.8 + 0.3,
      phase: Math.random() * Math.PI * 2,
      colorRGB: Math.random() < 0.2 ? googleColors[Math.floor(Math.random() * googleColors.length)] : "255,255,255",
      hasGlow: i >= 200,
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

        if (star.hasGlow) {
          const grad = ctx.createRadialGradient(x, y, 0, x, y, star.r * 4);
          grad.addColorStop(0, `rgba(${star.colorRGB},${opacity * 0.5})`);
          grad.addColorStop(1, `rgba(${star.colorRGB},0)`);
          ctx.beginPath();
          ctx.arc(x, y, star.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${star.colorRGB},${opacity})`;
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
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-[1] [transform:translateZ(0)]" />
  );
}

const nodeData = [
  {
    id: "1", index: 0,
    label: { ko: "공지사항", en: "Notice" },
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
    card: { badge: { ko: "NOTICE", en: "NOTICE" }, badgeSub: { ko: "필독", en: "Must Read" }, title: { ko: "주요 공지사항", en: "Key Notices" }, desc: { ko: "프로그램 운영 및 지원금 관련\n중요 안내사항을 확인하세요.", en: "Check important announcements\nregarding program operations and funding." }, href: "/notice" },
  },
  {
    id: "2", index: 1,
    label: { ko: "행사 소식", en: "Event News" },
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    card: { badge: { ko: "EVENT", en: "EVENT" }, badgeSub: { ko: "일정", en: "Schedule" }, title: { ko: "네트워킹 데이 및 세미나", en: "Networking Day & Seminars" }, desc: { ko: "오프라인 밋업 및 전문가 특강\n일정을 안내해 드립니다.", en: "We provide schedules for\noffline meetups and expert lectures." }, href: "/events" },
  },
  {
    id: "3", index: 2,
    label: { ko: "최신게시물", en: "Latest Posts" },
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
    card: { badge: { ko: "UPDATES", en: "UPDATES" }, badgeSub: { ko: "New", en: "New" }, title: { ko: "커뮤니티 소식", en: "Community News" }, desc: { ko: "Around X 참여기업의 최신 근황과\n자유로운 소통 공간입니다.", en: "A space for the latest updates\nand open communication among Around X companies." }, href: "#community-section" },
  },
  {
    id: "4", index: 3,
    label: { ko: "자료실", en: "Resources" },
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
    card: { badge: { ko: "RESOURCE", en: "RESOURCE" }, badgeSub: { ko: "다운로드", en: "Download" }, title: { ko: "가이드 및 VOD", en: "Guides & VOD" }, desc: { ko: "IR 템플릿, 교육 영상(VOD) 등\n사업 성장에 필요한 자료 모음입니다.", en: "A collection of materials necessary for business growth,\nsuch as IR templates and educational videos." }, href: "/resources" },
  },
  {
    id: "5", index: 4,
    label: { ko: "인사이트", en: "Insights" },
    icon: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /><path d="M9 7h7" /><path d="M9 11h7" /></svg>,
    card: { badge: { ko: "INSIGHTS", en: "INSIGHTS" }, badgeSub: { ko: "콘텐츠", en: "Content" }, title: { ko: "인사이트", en: "Insights" }, desc: { ko: "Global X Pass의 리포트와\n인사이트 콘텐츠를 확인하세요.", en: "Explore Global X Pass reports\nand insight content." }, href: "/insights" },
  },
];

const heroProgramInfo = {
  label: { ko: "PROGRAM INFO", en: "PROGRAM INFO" },
  title: { ko: ["Around X", "글로벌 협업 프로그램"], en: ["Around X", "Global Collaboration Program"] },
  description: {
    ko: "중소벤처기업부, 창업진흥원, 글로벌기업(구글플레이, 르노, 핀칸티에리)과 넥스트챌린지가 공동 운영하는 대한민국 대표 스타트업 액셀러레이팅 프로그램입니다.\n\n잠재력 있는 기업을 발굴하여 글로벌 성공 스토리를 함께\n만들어가는 데 기여하겠습니다.",
    en: "Around X is a leading Korean startup acceleration program jointly operated by the Ministry of SMEs and Startups, KISED, global companies (Google Play, Renault Korea, and Fincantieri), and Next Challenge.\n\nWe contribute to discovering high-potential companies and creating global success stories together.",
  },
  hint: { ko: "중앙 코어를 클릭해 Around X 프로그램 정보 보기", en: "Click the central core to view Around X program information" },
} as const;

export function HeroSection() {
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const [expanded, setExpanded] = useState(false);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1280);

  const angleRef = useRef(0);
  const isAutoRotatingRef = useRef(true);
  const animFrameRef = useRef<number>(0);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const radiusRef = useRef(0);

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

  const SCENE = 800 * scale;
  const INNER_ORBIT = 560 * scale;
  const OUTER_ORBIT = 780 * scale;
  const CORE = 120 * scale;
  const NODE = 84 * scale;
  const ICON = 34 * scale;
  const RADIUS = 280 * scale;
  radiusRef.current = RADIUS;

  const animate = useCallback(() => {
    if (isAutoRotatingRef.current) angleRef.current += 0.1;
    nodeData.forEach((node) => {
      const a = (angleRef.current + (node.index / nodeData.length) * 360) * (Math.PI / 180);
      const x = radiusRef.current * Math.cos(a);
      const y = radiusRef.current * Math.sin(a);
      const el = nodeRefs.current[node.id];
      if (el) el.style.transform = `translate(${x}px, ${y}px)`;
    });
    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [animate]);

  const handleCoreClick = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    setExpanded((prev) => {
      const next = !prev;
      if (!next) { setActiveNode(null); isAutoRotatingRef.current = true; }
      else { isAutoRotatingRef.current = false; }
      return next;
    });
  };

  const handleNodeClick = (e: React.SyntheticEvent, id: string) => {
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

  const infoLang = lang as "ko" | "en";

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
        @keyframes rotateBrand {
          0%   { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .orbit-light-inner { position: absolute; border-radius: 50%; pointer-events: none; animation: spinLight 12s linear infinite; }
        .orbit-light-outer { position: absolute; border-radius: 50%; pointer-events: none; animation: spinLight 22s linear infinite reverse; }
        .orbit-light-inner::before, .orbit-light-outer::before {
          content: ''; position: absolute; top: 0; left: 50%; transform: translate(-50%, -50%);
          width: 8px; height: 8px; border-radius: 50%; background: #fff;
          box-shadow: 0 0 15px 5px rgba(255,255,255,0.9), 0 0 30px 10px rgba(66,133,244,0.6);
        }
        .brand-orbit {
          position: absolute; top: 50%; left: 50%; border-radius: 50%; border: 2px solid transparent;
          background-image: linear-gradient(#0c1221, #0c1221), linear-gradient(to right, #4285F4, #EA4335, #FBBC05, #34A853);
          background-origin: border-box; background-clip: content-box, border-box;
          opacity: 0.3; animation: rotateBrand 15s linear infinite; pointer-events: none;
        }
        .core-ring { animation: corePulse 3s ease-in-out infinite; }
        .core-ring::after {
          content: ''; position: absolute; top: -6%; left: -6%; width: 112%; height: 112%; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.45); box-shadow: 0 0 20px rgba(66,133,244,0.5);
          animation: coreGlow 2s ease-in-out infinite alternate; pointer-events: none;
        }
      `}</style>

      <section
        onClick={handleBgClick}
        aria-label="Around X 글로벌 기업 협업 프로그램"
        className="relative w-[100vw] max-w-full h-[95dvh] max-md:min-h-[700px] md:min-h-[900px] overflow-hidden flex items-center justify-center font-['Pretendard',-apple-system,sans-serif] left-1/2 -translate-x-1/2"
        style={{
          background: "radial-gradient(circle at 20% 30%, rgba(40,20,80,0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(20,40,80,0.3) 0%, transparent 50%), radial-gradient(circle at center, #16223a 0%, #0c1221 60%, #000 100%)"
        }}
      >
        <StarField />

        <div className={`relative flex items-center justify-center shrink-0 transition-transform duration-[1200ms] ease-[cubic-bezier(0.19,1,0.22,1)] z-10 ${expanded ? "max-lg:-translate-y-[18%] lg:-translate-x-[22%]" : "translate-none"}`} style={{ width: `${SCENE}px`, height: `${SCENE}px` }}>
          <div className="brand-orbit z-[2]" style={{ width: `${INNER_ORBIT}px`, height: `${INNER_ORBIT}px` }} />
          <div className="brand-orbit z-[2] opacity-15" style={{ width: `${OUTER_ORBIT}px`, height: `${OUTER_ORBIT}px`, animationDirection: "reverse", animationDuration: "25s" }} />

          <div className="core-ring relative z-[100] cursor-pointer rounded-full border-[1.5px] border-[rgba(255,255,255,0.18)] backdrop-blur-[8px]" role="button" tabIndex={0} aria-label="Around X 프로그램 정보 보기" onClick={handleCoreClick} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleCoreClick(e); }} style={{ width: `${CORE}px`, height: `${CORE}px`, background: "radial-gradient(circle at 35% 35%, rgba(66,133,244,0.25), rgba(10,15,30,0.8))" }} />

          <div className="absolute border border-dashed border-[rgba(255,255,255,0.13)] rounded-full pointer-events-none" style={{ width: `${INNER_ORBIT}px`, height: `${INNER_ORBIT}px` }} />
          <div className="orbit-light-inner" style={{ width: `${INNER_ORBIT}px`, height: `${INNER_ORBIT}px` }} />
          <div className="absolute border border-[rgba(255,255,255,0.05)] rounded-full pointer-events-none" style={{ width: `${OUTER_ORBIT}px`, height: `${OUTER_ORBIT}px` }} />
          <div className="orbit-light-outer" style={{ width: `${OUTER_ORBIT}px`, height: `${OUTER_ORBIT}px` }} />

          {nodeData.map((node) => {
            const isActive = activeNode === node.id;
            return (
              <div key={node.id} role="button" tabIndex={0} ref={(el) => { nodeRefs.current[node.id] = el; }} onClick={(e) => handleNodeClick(e, node.id)} onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleNodeClick(e, node.id); }} className={`absolute cursor-pointer will-change-transform ${isActive ? "z-[150]" : "z-[20]"}`} style={{ width: `${NODE}px`, height: `${NODE}px`, left: `calc(50% - ${NODE / 2}px)`, top: `calc(50% - ${NODE / 2}px)` }}>
                <div className={`w-full h-full rounded-full flex items-center justify-center transition-all duration-[550ms] ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? "bg-[rgba(255,255,255,0.15)] border-[1.5px] border-white shadow-[0_0_28px_rgba(255,255,255,0.35)] scale-[1.18]" : "bg-[rgba(25,28,38,0.85)] border border-[rgba(255,255,255,0.22)] shadow-none scale-100"}`}>
                  <span className={`text-white flex items-center justify-center ${isActive ? "opacity-100" : "opacity-[0.82]"}`} style={{ width: `${ICON}px`, height: `${ICON}px` }}>{node.icon}</span>
                </div>
                <span className="absolute left-1/2 -translate-x-1/2 text-[#e2e2e3] whitespace-nowrap font-bold tracking-[-0.02em]" style={{ top: `${NODE + 12}px`, fontSize: `${Math.max(11, 16 * scale)}px`, textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}>
                  {node.label[lang as "ko" | "en"]}
                </span>

                {!isMobile && (
                  <div onClick={(e) => e.stopPropagation()} className={`absolute top-1/2 bg-[rgba(14,18,28,0.88)] border border-[rgba(255,255,255,0.14)] rounded-[20px] transition-all duration-400 ease backdrop-blur-[14px] text-left z-[200] shadow-[0_24px_48px_rgba(0,0,0,0.65)] flex flex-col gap-[10px] ${isActive ? "-translate-y-1/2 translate-x-0 opacity-100 pointer-events-auto" : "-translate-y-1/2 -translate-x-[15px] opacity-0 pointer-events-none"}`} style={{ left: `calc(100% + ${16 * scale}px)`, width: `${Math.min(300, windowWidth * 0.28)}px`, padding: `${22 * scale}px` }}>
                    <CardContent node={node} scale={scale} onNavigate={navigate} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {isMobile && activeNodeData && (
          <div className="absolute bottom-[24px] left-1/2 -translate-x-1/2 w-[calc(100%-48px)] max-w-[400px] z-[300] bg-[rgba(14,18,28,0.92)] border border-[rgba(255,255,255,0.14)] p-[22px] rounded-[20px] backdrop-blur-[14px] shadow-[0_24px_48px_rgba(0,0,0,0.7)] flex flex-col gap-[10px] animate-[fadeSlideUp_0.35s_ease_forwards]" onClick={(e) => e.stopPropagation()}>
            <CardContent node={activeNodeData} scale={1} onNavigate={navigate} />
          </div>
        )}

        <div onClick={(e) => e.stopPropagation()} className={`absolute transition-all duration-[1200ms] ease-[cubic-bezier(0.19,1,0.22,1)] z-20 ${expanded ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} max-lg:left-1/2 max-lg:-translate-x-1/2 max-lg:text-center max-md:w-[90%] md:max-lg:w-[70%] ${expanded ? 'max-lg:bottom-[36px]' : 'max-lg:-bottom-[300px]'} lg:top-1/2 lg:-translate-y-1/2 lg:w-[400px] lg:text-left ${expanded ? 'lg:right-[8%]' : 'lg:-right-[520px]'}`}>
          <div className="text-[#4285F4] font-extrabold tracking-[2px] mb-[12px]" style={{ fontSize: `${Math.max(11, 13 * scale)}px` }}>
            {heroProgramInfo.label[infoLang]}
          </div>
          <h1 className="text-white font-extrabold m-0 mb-[20px] tracking-[-1.5px] leading-[1.2]" style={{ fontSize: `${Math.max(24, 42 * scale)}px` }}>
            {heroProgramInfo.title[infoLang].map((line, index) => (
              <span key={line}>
                {line}
                {index < heroProgramInfo.title[infoLang].length - 1 && <br />}
              </span>
            ))}
          </h1>
          <p className="m-0 leading-[1.8] break-keep whitespace-pre-line" style={{ color: "rgba(255, 255, 255, 0.86)", fontSize: `${Math.max(14, 17 * scale)}px` }}>
            {heroProgramInfo.description[infoLang]}
          </p>
        </div>

        {!expanded && (
          <div className="absolute left-1/2 -translate-x-1/2 text-[rgba(255,255,255,0.35)] tracking-[0.05em] whitespace-nowrap z-[5] font-medium max-md:bottom-[28px] md:bottom-[40px]" style={{ fontSize: `${Math.max(11, 13 * scale)}px` }}>
            {heroProgramInfo.hint[infoLang]}
          </div>
        )}
      </section>
    </>
  );
}

function CardContent({ node, scale, onNavigate }: { node: typeof nodeData[0]; scale: number; onNavigate: (to: string) => void }) {
  const { lang } = useLanguage();
  const isEn = lang === "en";

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-[11px] bg-[#4285F4] text-white px-[10px] py-[4px] rounded-[6px] font-extrabold tracking-[0.05em]">
          {node.card.badge[isEn ? "en" : "ko"]}
        </span>
        <small className="text-[rgba(255,255,255,0.5)] text-[13px] font-mono font-semibold">
          {node.card.badgeSub[isEn ? "en" : "ko"]}
        </small>
      </div>
      <h3 className="m-0 text-white font-extrabold leading-[1.3]" style={{ fontSize: `${Math.max(17, 21 * scale)}px` }}>
        {node.card.title[isEn ? "en" : "ko"]}
      </h3>
      <p className="m-0 text-[rgba(255,255,255,0.85)] leading-[1.65] break-keep whitespace-pre-line" style={{ fontSize: `${Math.max(13, 15 * scale)}px` }}>
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
        className="self-end mt-[6px] text-white font-extrabold text-[14px] underline cursor-pointer opacity-90 transition-opacity duration-200 hover:opacity-100"
      >
        {isEn ? "View Details →" : "자세히 보기 →"}
      </div>
    </>
  );
}
