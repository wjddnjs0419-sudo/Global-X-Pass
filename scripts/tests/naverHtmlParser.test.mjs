import test from "node:test";
import assert from "node:assert";
import {
  decodeHtmlEntities,
  parseCategoryNoFromHtml,
} from "../utils/naverHtmlParser.mjs";
import {
  isNaverImportedContent,
  stripNaverImportMeta,
  normalizeNaverImportedHtml,
} from "../../src/utils/naverImportShared.js";

test("naverHtmlParser - decodeHtmlEntities", () => {
  assert.strictEqual(decodeHtmlEntities("&lt;div&gt;Hello&lt;/div&gt;"), "<div>Hello</div>");
  assert.strictEqual(decodeHtmlEntities("&#x27;quote&#x27;"), "'quote'");
  assert.strictEqual(decodeHtmlEntities("test&nbsp;test"), "test test");
});

test("naverHtmlParser - parseCategoryNoFromHtml", () => {
  const html1 = `<a href="?categoryNo=42">★글로벌 기업 협업 프로그램</a>`;
  assert.strictEqual(parseCategoryNoFromHtml(html1, "★글로벌 기업 협업 프로그램"), "42");

  const html2 = `{"categoryNo":123,"categoryName":"Around X-뉴스레터"}`;
  assert.strictEqual(parseCategoryNoFromHtml(html2, "Around X-뉴스레터"), "123");
});

test("naverHtmlParser - normalizeNaverImportedHtml (Empty Spacer Paragraphs)", () => {
  // 빈 문단 제거 확인
  const inputEmpty = `<p class="se-text-paragraph se-text-paragraph-align-left"><br></p>`;
  assert.strictEqual(normalizeNaverImportedHtml(inputEmpty), "");

  // 의미 있는 텍스트가 있는 문단 보존
  const inputText = `<p><span>Hello</span></p>`;
  assert.strictEqual(normalizeNaverImportedHtml(inputText), inputText);

  // 빈 이미지 문단 보존 (엣지 케이스)
  const inputImg = `<p><img src="test.jpg" /></p>`;
  assert.strictEqual(normalizeNaverImportedHtml(inputImg), inputImg);

  const inputVideo = `<p><video src="video.mp4" /></p>`;
  assert.strictEqual(normalizeNaverImportedHtml(inputVideo), inputVideo);
});

test("naverHtmlParser - normalizeNaverImportedHtml (Class substitution)", () => {
  const inputContainer = `<div class="se-main-container">Content</div>`;
  const output = normalizeNaverImportedHtml(inputContainer);
  assert.ok(output.includes('data-gxp-se-root="naver"'));
  assert.ok(output.includes('data-gxp-se-source="naver"'));

  const inputImageGroup = `<div class="se-component se-imageGroup">Images</div>`;
  const outputImageGroup = normalizeNaverImportedHtml(inputImageGroup);
  assert.ok(outputImageGroup.includes('data-gxp-se="imageCollage"'));
  assert.ok(outputImageGroup.includes('data-gxp-se-block="imageCollage"'));
  assert.ok(outputImageGroup.includes('data-gxp-se-flow="media-stack"'));
});

test("naverHtmlParser - normalizeNaverImportedHtml (Style replacement)", () => {
  // padding, margin 등의 스타일 제거
  const inputStyle = `<div style="color: red; margin: 10px; font-size: 14px;">Text</div>`;
  const outputStyle = normalizeNaverImportedHtml(inputStyle);
  assert.ok(!outputStyle.includes('color: red'));
  assert.ok(!outputStyle.includes('margin: 10px'));
  assert.ok(!outputStyle.includes('font-size: 14px'));
  
  // 유지되어야 하는 스타일 테스트 (예: border)
  const inputStyleKeep = `<div style="border: 1px solid black; padding: 10px;">Text</div>`;
  const outputStyleKeep = normalizeNaverImportedHtml(inputStyleKeep);
  assert.ok(outputStyleKeep.includes('border: 1px solid black'));
  assert.ok(!outputStyleKeep.includes('padding: 10px'));
});
