import { afterEach, describe, expect, it, vi } from "vitest";

const uploadMock = vi.fn((..._args: unknown[]) => Promise.resolve({ error: null }));
const getPublicUrlMock = vi.fn(() => ({ data: { publicUrl: "https://cdn/x.png" } }));

vi.mock("../../lib/supabaseClient", () => ({
  supabase: {
    storage: {
      from: () => ({ upload: uploadMock, getPublicUrl: getPublicUrlMock }),
    },
  },
}));

import { uploadThumbnailIfDataUrl } from "./editor";

afterEach(() => {
  uploadMock.mockClear();
  getPublicUrlMock.mockClear();
  vi.unstubAllGlobals();
});

describe("uploadThumbnailIfDataUrl", () => {
  it("data URL 업로드 시 1년 cacheControl 을 전달한다 (egress 절감 가드)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ blob: async () => new Blob(["x"], { type: "image/png" }) })));

    await uploadThumbnailIfDataUrl("data:image/png;base64,AAAA");

    expect(uploadMock).toHaveBeenCalledTimes(1);
    const options = uploadMock.mock.calls[0][2];
    expect(options).toMatchObject({ cacheControl: "31536000" });
  });

  it("data URL 이 아니면 업로드하지 않고 원본을 반환한다", async () => {
    const url = "https://cdn/already-uploaded.png";
    const result = await uploadThumbnailIfDataUrl(url);
    expect(result).toBe(url);
    expect(uploadMock).not.toHaveBeenCalled();
  });
});
