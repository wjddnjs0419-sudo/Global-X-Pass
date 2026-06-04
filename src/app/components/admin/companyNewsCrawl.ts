// 회사뉴스 크롤 공유 상수·타입.
// 메인 웹앱(AdminCompanyNewsManagement)과 본인 전용 아키텍처 맵이 함께 쓴다.
// 맵 디렉토리는 git 추적에서 제외되므로, 공유 심볼의 단일 출처는 맵 밖인 이 파일에 둔다.
// (맵의 architecture/constants·types는 여기서 re-export만 한다.)

export const COMPANY_NEWS_CRAWL_DEFAULT_OPTIONS = {
  batchSize: 25,
  resultsPerCompany: 1,
  delayMs: 300,
  maxStoredArticles: 300,
  minRelevanceScore: 3,
};

export type CompanyNewsCrawlOptions = {
  batchSize: number;
  resultsPerCompany: number;
  delayMs: number;
  maxStoredArticles: number;
  minRelevanceScore: number;
};

export type CompanyNewsTriggerResult = {
  success?: boolean;
  dispatched?: boolean;
  dispatchError?: string | null;
  inputs?: Record<string, string>;
  error?: string;
};
