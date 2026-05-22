export interface Company {
  id: string;
  name: string;
  slug: string;
  industry: string;
  participation_year: number | null;
  description: string;
  website_url: string;
  status: "published" | "draft";
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  thumbnail_url?: string | null;
  thumbnail_crop?: ThumbnailCrop | null;
  created_at: string;
  updated_at?: string | null;
  views: number;
  allowed_group_id?: string | null;
  // event fields
  status?: string | null;
  event_date?: string | null;
  location?: string | null;
  event_status?: string | null;
  application_deadline?: string | null;
  capacity?: number | null;
  slots_remaining?: number | null;
  tags?: string | null;
  event_form_config?: EventFormConfig | null;
  // blog
  is_featured?: boolean | null;
}

export interface ThumbnailCrop {
  x: number;
  y: number;
  zoom: number;
  aspect: '7/1' | '16/10' | '16/9' | '10/9' | '1/1' | '540/675';
}

export interface EventFormConfig {
  intro?: string;
  companyTechLabel?: string;
  nameLabel?: string;
  positionLabel?: string;
  emailLabel?: string;
  phoneLabel?: string;
  expectationLabel?: string;
  interestsLabel?: string;
  interestOptions?: string[];
  speakerQuestionLabel?: string;
  privacyConsentLabel?: string;
  completionTitle?: string;
  completionMessage?: string;
  customQuestions?: EventCustomQuestion[];
}

export interface EventCustomQuestion {
  id: string;
  label: string;
  type: 'short_text' | 'long_text';
  required: boolean;
}

export interface EventApplication {
  id: string;
  post_id: string;
  user_id: string;
  company_tech: string;
  applicant_name: string;
  position: string;
  email: string;
  phone: string | null;
  expectation: string;
  interests: string[];
  speaker_question: string | null;
  privacy_consent: boolean;
  answers?: Record<string, string> | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

// ── RBAC ──────────────────────────────────────────────────────────
export interface MemberGroup {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface GroupMember {
  user_id: string;
  group_id: string;
  added_at: string;
}

// ── 1:1 컨설팅 ────────────────────────────────────────────────────
export interface Consultant {
  id: string;
  name: string;
  category: string;
  bio: string | null;
  expertise: string[];
  image_url: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export interface ConsultingSlot {
  id: string;
  consultant_id: string;
  slot_date: string;
  slot_time: string;
  duration_minutes: number;
  status: 'available' | 'booked' | 'cancelled';
  location?: string | null;
  created_at: string;
}

export interface ConsultingReservation {
  id: string;
  slot_id: string;
  user_id: string;
  description: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  admin_note: string | null;
  created_at: string;
}

// ── Founder's Club ────────────────────────────────────────────────
export interface FoundersClubSession {
  id: string;
  theme: string;
  description: string | null;
  max_participants: number;
  session_date: string | null;
  session_time: string | null;
  location?: string | null;
  status: 'recruiting' | 'closed' | 'completed';
  created_at: string;
}

export interface FoundersClubApplication {
  id: string;
  session_id: string;
  user_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone: string;
  company: string;
  user_type: string;
  role: 'admin' | 'participant' | 'user';
}

export interface PageView {
  visitor_id: string;
  page_path: string;
  user_agent: string;
  referrer: string;
}

// ── Runtime observability ─────────────────────────────────────────
export type ErrorIssueStatus = 'open' | 'monitoring' | 'resolved' | 'reopened' | 'ignored';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorIssue {
  fingerprint: string;
  source: string;
  severity: ErrorSeverity;
  status: ErrorIssueStatus;
  message: string;
  stack: string | null;
  path: string | null;
  context: Record<string, unknown> | null;
  source_location: string | null;
  first_seen_at: string;
  last_seen_at: string;
  last_build_id: string | null;
  last_log_id: string | null;
  occurrence_count: number;
  monitoring_at: string | null;
  resolved_at: string | null;
  ignored_at: string | null;
  reopened_at: string | null;
  resolved_note: string | null;
  updated_at: string;
}
