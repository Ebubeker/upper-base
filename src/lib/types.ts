export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
}

export type CommunityCategory =
  | 'general'
  | 'education'
  | 'technology'
  | 'business'
  | 'health'
  | 'creative'
  | 'sports'
  | 'gaming'
  | 'lifestyle'
  | 'other';

export interface Community {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  slug: string;
  avatar_url?: string;
  banner_url?: string;
  category: CommunityCategory;
  is_public: boolean;
  is_paid: boolean;
  price?: number;
  stripe_product_id?: string;
  stripe_price_id?: string;
  custom_module_names: Record<string, string>;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface CommunityModule {
  id: string;
  community_id: string;
  module_type: ModuleType;
  is_enabled: boolean;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export type ModuleType = 'chat' | 'notes' | 'tasks' | 'zoom';

export interface ModuleConfig {
  type: ModuleType;
  name: string;
  description: string;
  icon: string;
  defaultConfig: Record<string, any>;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Note {
  id: string;
  community_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  community_id: string;
  user_id: string;
  title: string;
  description?: string;
  is_completed: boolean;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  community_id: string;
  user_id: string;
  content: string;
  created_at: string;
}
