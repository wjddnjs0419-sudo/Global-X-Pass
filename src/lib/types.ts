export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  created_at: string;
  views: number;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string;
  company: string;
  user_type: string;
  role: 'admin' | 'user';
}

export interface PageView {
  visitor_id: string;
  page_path: string;
  user_agent: string;
  referrer: string;
}
