import { useEffect, useMemo, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import { Check, ImageIcon, RotateCcw, X } from "lucide-react";
import { useTheme } from "../../ThemeContext";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { isBrowserSafeImageFile } from "../../../utils/file";
import {
  getThumbnailAspectNumber,
  getThumbnailOutputSize,
  toCssAspectRatio,
  type ThumbnailAspect,
  type ThumbnailCandidate,
} from "../../../utils/postThumbnail";

interface AdvancedThumbnailEditorProps {
  aspect: ThumbnailAspect;
  candidates: ThumbnailCandidate[];
  value: string | null;
  onChange: (value: string | null) => void;
  title?: string;
  statusLabel?: string;
  emptyStatusLabel?: string;
  appliedLabel?: string;
  emptyText?: string;
  singleImageMode?: boolean;
}

interface SourceImage {
  id: string;
  url: string;
  label: string;
  source: "content" | "attachment" | "upload" | "applied";
  objectUrl?: string;
}

interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

type DragState = {
  mode: "move" | "resize";
  handle?: ResizeHandleKey;
  pointerId: number;
  startX: number;
  startY: number;
  startRect: CropRect;
};

type ResizeHandleKey = "nw" | "ne" | "sw" | "se";

interface ResizeHandle {
  key: ResizeHandleKey;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  cursor: string;
}

const RESIZE_HANDLES: ResizeHandle[] = [
  { key: "nw", top: -7, left: -7, cursor: "nwse-resize" },
  { key: "ne", top: -7, right: -7, cursor: "nesw-resize" },
  { key: "sw", bottom: -7, left: -7, cursor: "nesw-resize" },
  { key: "se", bottom: -7, right: -7, cursor: "nwse-resize" },
];

const SOURCE_LABEL: Record<SourceImage["source"], string> = {
  content: "본문",
  attachment: "첨부",
  upload: "업로드",
  applied: "적용됨",
};

const MIN_CROP_WIDTH = 18;
const MAX_STAGE_WIDTH = 560;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const loadImage = (url: string) => new Promise<HTMLImageElement>((resolve, reject) => {
  const img = new Image();
  if (!url.startsWith("data:") && !url.startsWith("blob:")) {
    img.crossOrigin = "anonymous";
  }
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = url;
});

const getRectHeight = (width: number, imageAspect: number, targetAspect: number) =>
  width * imageAspect / targetAspect;

const normalizeRect = (rect: CropRect, imageAspect: number, targetAspect: number): CropRect => {
  const maxWidthForHeight = 100 * targetAspect / imageAspect;
  const maxWidth = Math.min(100, maxWidthForHeight);
  const width = clamp(rect.width, MIN_CROP_WIDTH, maxWidth);
  const height = getRectHeight(width, imageAspect, targetAspect);
  const x = clamp(rect.x, 0, 100 - width);
  const y = clamp(rect.y, 0, 100 - height);
  return { x, y, width, height };
};

const createDefaultCropRect = (imageAspect: number, targetAspect: number): CropRect => {
  const widthFromHeight = 78 * targetAspect / imageAspect;
  const width = Math.min(78, widthFromHeight);
  const height = getRectHeight(width, imageAspect, targetAspect);
  return normalizeRect({
    x: (100 - width) / 2,
    y: (100 - height) / 2,
    width,
    height,
  }, imageAspect, targetAspect);
};

const cropImageToDataUrl = async (url: string, rect: CropRect, aspect: ThumbnailAspect, outputWidth?: number) => {
  const image = await loadImage(url);
  const defaultOutputSize = getThumbnailOutputSize(aspect);
  const outputSize = outputWidth
    ? { width: outputWidth, height: Math.round(outputWidth / getThumbnailAspectNumber(aspect)) }
    : defaultOutputSize;
  const canvas = document.createElement("canvas");
  canvas.width = outputSize.width;
  canvas.height = outputSize.height;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context is unavailable.");

  const sourceX = image.naturalWidth * (rect.x / 100);
  const sourceY = image.naturalHeight * (rect.y / 100);
  const sourceWidth = image.naturalWidth * (rect.width / 100);
  const sourceHeight = image.naturalHeight * (rect.height / 100);

  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, outputSize.width, outputSize.height);
  return canvas.toDataURL("image/jpeg", 0.88);
};

export function AdvancedThumbnailEditor({
  aspect,
  candidates,
  value,
  onChange,
  title = "대표 썸네일",
  statusLabel = "수동 지정됨",
  emptyStatusLabel = "자동 선택 사용 중",
  appliedLabel = "현재 적용된 대표 썸네일",
  emptyText = "본문 이미지 또는 업로드 이미지가 여기에 표시됩니다.",
  singleImageMode = false,
}: AdvancedThumbnailEditorProps) {
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageStageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [uploadedSource, setUploadedSource] = useState<SourceImage | null>(null);
  const [modalSource, setModalSource] = useState<SourceImage | null>(null);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  const appliedSource = useMemo<SourceImage | null>(() => {
    if (!value) return null;
    return { id: "applied-thumbnail", url: value, label: appliedLabel, source: "applied" };
  }, [appliedLabel, value]);

  const candidateSources = useMemo<SourceImage[]>(() => candidates.map(candidate => ({
    id: candidate.url,
    url: candidate.url,
    label: candidate.label,
    source: candidate.source,
  })), [candidates]);

  const sources = useMemo(
    () => [uploadedSource, ...candidateSources].filter(Boolean) as SourceImage[],
    [candidateSources, uploadedSource],
  );
  const visibleSources = singleImageMode && value ? [] : sources;

  const outputSize = getThumbnailOutputSize(aspect);
  const targetAspect = getThumbnailAspectNumber(aspect);
  const imageAspect = imageSize ? imageSize.width / imageSize.height : targetAspect;
  const activeRect = cropRect ?? createDefaultCropRect(imageAspect, targetAspect);
  const panelBg = isDark ? "rgba(255,255,255,0.035)" : "rgba(15,23,42,0.035)";
  const inputBg = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const labelBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.09)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const selectedBg = isDark ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.07)";
  const checkerBg = isDark
    ? "linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.06) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.06) 75%)"
    : "linear-gradient(45deg, rgba(15,23,42,0.08) 25%, transparent 25%), linear-gradient(-45deg, rgba(15,23,42,0.08) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(15,23,42,0.08) 75%), linear-gradient(-45deg, transparent 75%, rgba(15,23,42,0.08) 75%)";
  const aspectLabel = aspect === "10/9"
    ? "뉴스 카드 비율 10:9"
    : aspect === "16/10"
      ? "행사 아카이브 카드 비율 16:10"
      : aspect === "7/1"
        ? "행사 신청 배너 비율 7:1"
        : "정사각형 비율 1:1";

  useEffect(() => () => {
    if (uploadedSource?.objectUrl) URL.revokeObjectURL(uploadedSource.objectUrl);
  }, [uploadedSource]);

  const openEditor = (source: SourceImage) => {
    setModalSource(source);
    setImageSize(null);
    setCropRect(null);
    setLoadFailed(false);
  };

  const clearUploadedSource = () => {
    setUploadedSource(previous => {
      if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl);
      return null;
    });
  };

  const clearSelectedImage = () => {
    onChange(null);
    clearUploadedSource();
  };

  const closeEditor = () => {
    setModalSource(null);
    setImageSize(null);
    setCropRect(null);
    setPreviewUrl(null);
    setLoadFailed(false);
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isBrowserSafeImageFile(file)) {
      alert("SVG를 제외한 이미지 파일만 업로드 가능합니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("이미지 파일은 10MB 이하만 업로드 가능합니다.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const source: SourceImage = {
      id: `upload-${objectUrl}`,
      url: objectUrl,
      label: file.name,
      source: "upload",
      objectUrl,
    };
    setUploadedSource(previous => {
      if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl);
      return source;
    });
    openEditor(source);
  };

  const updateCropRect = (nextRect: CropRect) => {
    setCropRect(normalizeRect(nextRect, imageAspect, targetAspect));
  };

  useEffect(() => {
    let cancelled = false;
    if (!modalSource || !imageSize || loadFailed) {
      setPreviewUrl(null);
      return;
    }

    void cropImageToDataUrl(modalSource.url, activeRect, aspect, 360)
      .then(dataUrl => {
        if (!cancelled) setPreviewUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setPreviewUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [activeRect.height, activeRect.width, activeRect.x, activeRect.y, aspect, imageSize, loadFailed, modalSource]);

  const getPointInImage = (clientX: number, clientY: number) => {
    const rect = imageStageRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: clamp(((clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((clientY - rect.top) / rect.height) * 100, 0, 100),
    };
  };

  const beginMove = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "move",
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRect: activeRect,
    };
  };

  const beginResize = (event: PointerEvent<HTMLButtonElement>, handle: ResizeHandleKey) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: "resize",
      handle,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRect: activeRect,
    };
  };

  const dragCrop = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const stage = imageStageRef.current?.getBoundingClientRect();
    if (!drag || !stage) return;

    if (drag.mode === "move") {
      updateCropRect({
        ...drag.startRect,
        x: drag.startRect.x + ((event.clientX - drag.startX) / stage.width) * 100,
        y: drag.startRect.y + ((event.clientY - drag.startY) / stage.height) * 100,
      });
      return;
    }

    const point = getPointInImage(event.clientX, event.clientY);
    const start = drag.startRect;
    const centerX = start.x + start.width / 2;
    const centerY = start.y + start.height / 2;
    const horizontalDistance = Math.abs(point.x - centerX) * 2;
    const verticalDistanceAsWidth = Math.abs(point.y - centerY) * 2 * targetAspect / imageAspect;
    const nextWidth = Math.max(horizontalDistance, verticalDistanceAsWidth);
    updateCropRect({
      ...start,
      x: centerX - nextWidth / 2,
      y: centerY - getRectHeight(nextWidth, imageAspect, targetAspect) / 2,
      width: nextWidth,
      height: getRectHeight(nextWidth, imageAspect, targetAspect),
    });
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (drag && event.currentTarget.hasPointerCapture(drag.pointerId)) {
      event.currentTarget.releasePointerCapture(drag.pointerId);
    }
    dragRef.current = null;
  };

  const applyCrop = async () => {
    if (!modalSource || !imageSize) return;
    setApplying(true);
    try {
      const dataUrl = await cropImageToDataUrl(modalSource.url, activeRect, aspect);
      onChange(dataUrl);
      if (singleImageMode) clearUploadedSource();
      closeEditor();
    } catch {
      alert("이미지 보안 정책 때문에 이 이미지는 바로 편집할 수 없습니다. 이미지를 내려받아 업로드한 뒤 다시 적용해주세요.");
    } finally {
      setApplying(false);
    }
  };

  const resetCrop = () => {
    setCropRect(createDefaultCropRect(imageAspect, targetAspect));
  };

  const uploadDropzone = (
    <label
      className={visibleSources.length > 0 ? "flex min-h-[112px] w-[180px] shrink-0 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center" : "flex min-h-[92px] min-w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center"}
      style={{ borderColor: labelBorder, background: isDark ? "rgba(255,255,255,0.02)" : "#fafafa", color: textMain }}
    >
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <span className="text-xs font-extrabold" style={{ color: textMain }}>+ 이미지 추가하기</span>
      <span className="text-[11px] font-bold leading-5" style={{ color: textMuted }}>최대 10MB / JPG, PNG, GIF 지원</span>
    </label>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 18px", background: panelBg, border: `1px solid ${labelBorder}`, borderRadius: 14 }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: textMain }}>{title}</p>
            <Badge variant={value ? "blue" : "secondary"} shape="pill">
              {value ? statusLabel : emptyStatusLabel}
            </Badge>
          </div>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: textMuted, lineHeight: 1.5 }}>
            {aspectLabel} · {outputSize.width}x{outputSize.height}
          </p>
        </div>
      </div>

      {appliedSource && (
        <div className="relative">
          <button
            type="button"
            onClick={() => openEditor(appliedSource)}
            className="grid w-full grid-cols-[96px_minmax(0,1fr)] items-center gap-3 text-left"
            style={{
              minHeight: 86,
              padding: 10,
              paddingRight: 46,
              borderRadius: 12,
              border: `1px solid ${labelBorder}`,
              background: inputBg,
              color: textMain,
              cursor: "pointer",
            }}
          >
            <span style={{ display: "block", width: 96, aspectRatio: toCssAspectRatio(aspect), overflow: "hidden", borderRadius: 9, background: panelBg }}>
              <img src={appliedSource.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-extrabold">{appliedLabel}</span>
              <span className="mt-1 block text-[11px] font-bold" style={{ color: textMuted }}>클릭하면 현재 이미지를 다시 수정합니다.</span>
            </span>
          </button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="현재 적용 이미지 해제"
            onClick={event => {
              event.stopPropagation();
              clearSelectedImage();
            }}
            className="absolute right-2 top-2 h-8 w-8 rounded-full"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      )}

      {(!singleImageMode || !value) && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {visibleSources.map(source => (
            <button
              key={source.id}
              type="button"
              onClick={() => openEditor(source)}
              className="shrink-0 text-left"
              style={{
                width: 120,
                padding: 8,
                borderRadius: 12,
                border: `1px solid ${labelBorder}`,
                background: inputBg,
                color: textMain,
                cursor: "pointer",
              }}
            >
              <span style={{ display: "block", width: "100%", aspectRatio: toCssAspectRatio(aspect), overflow: "hidden", borderRadius: 9, background: panelBg }}>
                <img src={source.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </span>
              <span className="mt-2 block truncate text-xs font-extrabold">{source.label}</span>
              <span className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: selectedBg, color: textMuted }}>
                {SOURCE_LABEL[source.source]}
              </span>
            </button>
          ))}
          {visibleSources.length === 0 ? (
            singleImageMode ? uploadDropzone : (
              <div className="flex min-w-full flex-col gap-2">
                <div className="flex min-h-[68px] items-center justify-center rounded-xl border border-dashed px-4 text-center text-xs font-bold" style={{ borderColor: labelBorder, color: textMuted }}>
                  {emptyText}
                </div>
                {uploadDropzone}
              </div>
            )
          ) : (!singleImageMode ? uploadDropzone : null)}
        </div>
      )}

      {modalSource && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.56)" }}
        >
          <div
            className="w-full max-w-[980px] overflow-hidden rounded-2xl"
            style={{ background: isDark ? "#111827" : "#ffffff", border: `1px solid ${labelBorder}`, boxShadow: "0 24px 80px rgba(0,0,0,0.32)" }}
          >
            <div className="flex items-center justify-between gap-3 border-b px-5 py-4" style={{ borderColor: labelBorder }}>
              <div className="min-w-0">
                <p className="m-0 truncate text-sm font-extrabold" style={{ color: textMain }}>{modalSource.label}</p>
                <p className="m-0 mt-1 text-xs font-bold" style={{ color: textMuted }}>{SOURCE_LABEL[modalSource.source]} · {outputSize.width}x{outputSize.height}</p>
              </div>
              <Button type="button" variant="ghost" size="icon" aria-label="닫기" onClick={closeEditor}>
                <X aria-hidden="true" />
              </Button>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div
                className="flex min-h-[360px] items-center justify-center overflow-hidden rounded-xl p-4"
                style={{ backgroundImage: checkerBg, backgroundSize: "20px 20px", backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px" }}
              >
                <div
                  ref={imageStageRef}
                  onPointerMove={dragCrop}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className="relative w-full overflow-hidden"
                  style={{ maxWidth: MAX_STAGE_WIDTH }}
                >
                  <img
                    src={modalSource.url}
                    alt=""
                    draggable={false}
                    onLoad={event => {
                      const size = { width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight };
                      setImageSize(size);
                      setCropRect(createDefaultCropRect(size.width / size.height, targetAspect));
                      setLoadFailed(false);
                    }}
                    onError={() => setLoadFailed(true)}
                    style={{ width: "100%", height: "auto", display: "block", userSelect: "none" }}
                  />
                  {imageSize && !loadFailed && (
                    <div
                      onPointerDown={beginMove}
                      style={{
                        position: "absolute",
                        left: `${activeRect.x}%`,
                        top: `${activeRect.y}%`,
                        width: `${activeRect.width}%`,
                        height: `${activeRect.height}%`,
                        border: "2px solid #38A3FF",
                        boxShadow: "0 0 0 9999px rgba(0,0,0,0.48)",
                        cursor: "move",
                        touchAction: "none",
                      }}
                    >
                      <div style={{ position: "absolute", left: "33.33%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.65)" }} />
                      <div style={{ position: "absolute", left: "66.66%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.65)" }} />
                      <div style={{ position: "absolute", top: "33.33%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.65)" }} />
                      <div style={{ position: "absolute", top: "66.66%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.65)" }} />
                      {RESIZE_HANDLES.map(handle => (
                        <button
                          key={handle.key}
                          type="button"
                          aria-label="크롭 영역 크기 조정"
                          onPointerDown={event => beginResize(event, handle.key)}
                          style={{
                            position: "absolute",
                            top: handle.top,
                            right: handle.right,
                            bottom: handle.bottom,
                            left: handle.left,
                            width: 14,
                            height: 14,
                            borderRadius: 3,
                            border: "1px solid #38A3FF",
                            background: "#ffffff",
                            boxShadow: "0 1px 6px rgba(0,0,0,0.25)",
                            cursor: handle.cursor,
                            padding: 0,
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {loadFailed && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: textMuted }}>
                      이미지를 불러올 수 없습니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="m-0 text-xs font-extrabold" style={{ color: textMuted }}>미리보기</p>
                  <div className="mt-2 overflow-hidden rounded-xl" style={{ aspectRatio: toCssAspectRatio(aspect), background: panelBg, border: `1px solid ${labelBorder}`, position: "relative" }}>
                    {previewUrl ? (
                      <img src={previewUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImageIcon aria-hidden="true" size={24} strokeWidth={1.5} color={textMuted} />
                      </div>
                    )}
                  </div>
                </div>

                <Button type="button" variant="outline" onClick={resetCrop} disabled={!imageSize || applying}>
                  <RotateCcw aria-hidden="true" />
                  초기화
                </Button>
                <Button type="button" onClick={applyCrop} disabled={!imageSize || loadFailed || applying}>
                  <Check aria-hidden="true" />
                  {applying ? "적용 중..." : "적용"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
