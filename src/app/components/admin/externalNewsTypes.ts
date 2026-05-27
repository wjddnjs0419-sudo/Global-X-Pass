import type { ExternalNewsItem } from "../../../lib/types";

export type ExternalNewsDraftValues = {
  title: string;
  summary: string;
  source_name: string;
  external_url: string;
  published_date: string;
  status: ExternalNewsItem["status"];
};

