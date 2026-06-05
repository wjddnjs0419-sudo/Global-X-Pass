/**
 * CardNewsSlider — insight 게시판(마켓/테크/CEO) PDF 카드뉴스 슬라이더
 * ------------------------------------------------------------------
 * react-pdf로 PDF를 페이지별 canvas 렌더링하고 Swiper로 인스타그램처럼
 * 좌우 스와이프(터치/마우스 드래그/방향키/화살표 버튼)로 넘긴다.
 *
 * ▶ Usage example
 *   import { CardNewsSlider } from "@/app/components/insight/CardNewsSlider";
 *
 *   // 포트레이트(카드뉴스) 카테고리일 때만 렌더한다.
 *   // mediaCategories.ts 기준: report=마켓, issue-paper=테크, trend-report=CEO
 *   const CARD_NEWS_CATEGORIES = ["report", "issue-paper", "trend-report"] as const;
 *   type CardNewsCategory = (typeof CARD_NEWS_CATEGORIES)[number];
 *
 *   const isCardNews = (value: string): value is CardNewsCategory =>
 *     (CARD_NEWS_CATEGORIES as readonly string[]).includes(value);
 *
 *   // 기존 insight 게시판(MediaPage 등) 상세에서:
 *   {post.pdfUrl && isCardNews(post.category) && (
 *     <CardNewsSlider pdfUrl={post.pdfUrl} category={post.category} />
 *   )}
 *
 * ⚠️ 이 컴포넌트는 기존 insight 게시판 파일을 수정하지 않는다. 위 예시처럼
 *    소비 측에서 조건부로 import해 사용한다.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Swiper, SwiperSlide } from "swiper/react";
import { Keyboard, Navigation, Pagination, A11y } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper";

import { getMediaCategoryLabel } from "../../constants/mediaCategories";

// react-pdf 텍스트/주석 레이어 스타일 (정렬·선택 깨짐 방지)
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
// Swiper 코어 + 사용 모듈 CSS (누락 시 레이아웃·내비게이션 미동작)
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "./CardNewsSlider.css";

// Vite(ESM) 환경에서 pdfjs worker 경로 해석 — 번들된 pdfjs-dist의 worker를 사용한다.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export interface CardNewsSliderProps {
  /** PDF 파일 URL 또는 blob URL */
  pdfUrl: string;
  /** insight 카테고리 (mediaCategories.ts의 포트레이트 ID) */
  category: "report" | "issue-paper" | "trend-report";
}

/** 현재 슬라이드 기준 실제 렌더링할 페이지 범위(±N). 메모리/성능 절충. */
const RENDER_WINDOW = 1;

export function CardNewsSlider({ pdfUrl, category }: CardNewsSliderProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  // 재시도 시 <Document>를 강제 remount하기 위한 키
  const [reloadKey, setReloadKey] = useState<number>(0);
  const [pageWidth, setPageWidth] = useState<number | undefined>(undefined);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const swiperRef = useRef<SwiperInstance | null>(null);
  const categoryLabel = getMediaCategoryLabel(category);

  // 컨테이너 너비를 측정해 Page 너비로 사용 (반응형, 인스타처럼 꽉 차게)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setPageWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleLoadSuccess = useCallback((pdf: { numPages: number }) => {
    setNumPages(pdf.numPages);
    setStatus("ready");
  }, []);

  const handleLoadError = useCallback(() => {
    setStatus("error");
  }, []);

  const handleRetry = useCallback(() => {
    setStatus("loading");
    setNumPages(0);
    setActiveIndex(0);
    setReloadKey((key) => key + 1);
  }, []);

  const handleSlideChange = useCallback((swiper: SwiperInstance) => {
    setActiveIndex(swiper.activeIndex);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`card-news-slider card-news-slider--${category}`}
      role="group"
      aria-roledescription="carousel"
      aria-label={`${categoryLabel} 카드뉴스`}
    >
      <Document
        key={reloadKey}
        file={pdfUrl}
        onLoadSuccess={handleLoadSuccess}
        onLoadError={handleLoadError}
        loading={<SliderSkeleton />}
        error={<SliderError onRetry={handleRetry} />}
        noData={<SliderError onRetry={handleRetry} />}
      >
        {status === "ready" && numPages > 0 && (
          <Swiper
            modules={[Navigation, Pagination, Keyboard, A11y]}
            navigation
            pagination={{ type: "fraction" }}
            keyboard={{ enabled: true }}
            loop={false}
            autoHeight
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
            onSlideChange={handleSlideChange}
            className="card-news-slider__swiper"
          >
            {Array.from({ length: numPages }, (_, index) => {
              const pageNumber = index + 1;
              const shouldRender = Math.abs(index - activeIndex) <= RENDER_WINDOW;
              return (
                <SwiperSlide key={pageNumber} className="card-news-slider__slide">
                  {shouldRender && pageWidth ? (
                    <Page
                      pageNumber={pageNumber}
                      width={pageWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={<SliderSkeleton />}
                      className="card-news-slider__page"
                      // 캔버스 렌더 완료 후 swiper가 실제 페이지 높이로 재측정 → 위/아래 흰 여백 제거
                      onRenderSuccess={() => swiperRef.current?.updateAutoHeight()}
                    />
                  ) : (
                    // 윈도우 밖 페이지는 자리만 차지(레이지 렌더링)
                    <div className="card-news-slider__placeholder" aria-hidden="true" />
                  )}
                </SwiperSlide>
              );
            })}
          </Swiper>
        )}
      </Document>
    </div>
  );
}

function SliderSkeleton() {
  return (
    <div className="card-news-slider__skeleton" aria-hidden="true">
      <span className="card-news-slider__skeleton-shimmer" />
    </div>
  );
}

function SliderError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="card-news-slider__error" role="alert">
      <p className="card-news-slider__error-text">PDF를 불러올 수 없습니다</p>
      <button type="button" className="card-news-slider__retry" onClick={onRetry}>
        재시도
      </button>
    </div>
  );
}
