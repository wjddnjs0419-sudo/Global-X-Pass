export interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  image_url: string | null;
  created_at: string;
  updated_at?: string | null;
  views: number;
  allowed_group_id?: string | null;
  // event fields
  status?: string | null;
  event_date?: string | null;
  location?: string | null;
  event_status?: string | null;
  capacity?: number | null;
  slots_remaining?: number | null;
  tags?: string | null;
  // blog
  is_featured?: boolean | null;
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
  category: 'legal' | 'global' | 'tech';
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
  created_at: string;
}

export interface ConsultingReservation {
  id: string;
  slot_id: string;
  user_id: string;
  description: string;
  status: 'pending' | 'confirmed' | 'rejected';
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
  status: 'recruiting' | 'closed' | 'completed';
  created_at: string;
}

export interface FoundersClubApplication {
  id: string;
  session_id: string;
  user_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
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
