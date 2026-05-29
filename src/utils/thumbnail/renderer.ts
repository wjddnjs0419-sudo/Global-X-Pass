import type React from "react";
import { getThumbnailAspectNumber, type ThumbnailCrop } from "./parser";

const getPreciseThumbnailImageStyle = (crop: ThumbnailCrop): React.CSSProperties | null => {
  if (!crop.sourceAspect || crop.zoom < 1) return null;

  const targetAspect = getThumbnailAspectNumber(crop.aspect);
  const verticalScale = targetAspect / crop.sourceAspect;

  return {
    position: "absolute",
    left: `${50 - crop.x * crop.zoom}%`,
    top: `${50 - crop.y * crop.zoom * verticalScale}%`,
    right: "auto",
    bottom: "auto",
    width: `${crop.zoom * 100}%`,
    height: `${crop.zoom * verticalScale * 100}%`,
    maxWidth: "none",
    display: "block",
  };
};

export const getThumbnailImageStyle = (crop: ThumbnailCrop | null): React.CSSProperties => (
  crop ? getPreciseThumbnailImageStyle(crop) ?? {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: crop.zoom > 1 ? `scale(${crop.zoom})` : undefined,
    transformOrigin: `${crop.x}% ${crop.y}%`,
    display: "block",
  } : {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "50% 50%",
    display: "block",
  }
);
