export type PlanType = 'basic' | 'intermediate' | 'premium';
export type UserRole = 'superadmin' | 'school_admin' | 'editor' | 'parent' | 'student';
export type LeadSource = 'web' | 'whatsapp' | 'instagram' | 'facebook' | 'google' | 'referral' | 'walk_in' | 'other';
export type LeadStatus = 'new' | 'contacted' | 'visited' | 'enrolled' | 'lost';
export type EducationLevel = 'maternal' | 'preescolar' | 'primaria' | 'secundaria' | 'preparatoria';
export type StudentStatus = 'active' | 'inactive' | 'graduated' | 'transferred';
export type TourStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show';
export type BlockType =
  | 'hero'
  | 'text'
  | 'image'
  | 'gallery'
  | 'video'
  | 'cta'
  | 'testimonial'
  | 'faq'
  | 'stats'
  | 'team'
  | 'pricing'
  | 'map'
  | 'form'
  | 'custom';
export type PageSlug =
  | 'home'
  | 'about'
  | 'admissions'
  | 'academics'
  | 'campus'
  | 'blog'
  | 'events'
  | 'contact'
  | 'portal';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  custom_domain: string | null;
  plan: PlanType;
  active_modules: string[]; // parsed from jsonb
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  tenant_id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  tenant_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  children_count: number;
  level_interest: EducationLevel | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  tenant_id: string;
  full_name: string;
  grade: string;
  group_name: string | null;
  nfc_id: string | null;
  parent_user_id: string | null;
  date_of_birth: string | null;
  enrolled_at: string;
  status: StudentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ContentBlock {
  id: string;
  tenant_id: string;
  page: PageSlug;
  block_type: BlockType;
  order_index: number;
  data: Record<string, any>; // parsed from jsonb
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Tour {
  id: string;
  tenant_id: string;
  lead_id: string;
  scheduled_at: string;
  duration_minutes: number;
  google_event_id: string | null;
  status: TourStatus;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Database schema representation for Supabase types
export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: Omit<Tenant, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Tenant>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<User>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Lead>;
      };
      students: {
        Row: Student;
        Insert: Omit<Student, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Student>;
      };
      content_blocks: {
        Row: ContentBlock;
        Insert: Omit<ContentBlock, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ContentBlock>;
      };
      tours: {
        Row: Tour;
        Insert: Omit<Tour, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Tour>;
      };
    };
    Views: {};
    Functions: {
      get_my_tenant_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_my_role: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_tenant_dashboard_stats: {
        Args: { p_tenant_id: string };
        Returns: Record<string, any>;
      };
    };
    Enums: {
      plan_type: PlanType;
      user_role: UserRole;
      lead_source: LeadSource;
      lead_status: LeadStatus;
      education_level: EducationLevel;
      student_status: StudentStatus;
      tour_status: TourStatus;
      block_type: BlockType;
      page_slug: PageSlug;
    };
  };
}
