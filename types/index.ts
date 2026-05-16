export interface User {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  name?: string;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Generic profile used across the app
export interface Profile {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at?: string;
}

export interface BuilderProfile {
  user_id: string;
  full_name?: string;
  avatar_url?: string | null;

  title?: string;
  bio?: string | null;
  headline?: string | null;
  linkedin_url?: string | null;

  verification_status?: string;
  avg_rating?: number;
  total_deals?: number;
  response_time_hours?: number;

  specialties?: string[];
  skills?: string[];
  languages?: string[];

  hourly_rate?: number;

  // Subscription fields referenced by settings/studio pages
  subscription_plan?: string;
  subscription_status?: string;
  subscription_ends_at?: string;
  studio_builds_used?: number;
}

export interface BusinessProfile {
  user_id: string;
  business_name?: string;
  website?: string | null;
  industry?: string | null;
  company_size?: string | null;
}

export interface Agent {
  id: string;
  builder_id: string;
  name: string;

  builder_name?: string;
  avatar_url?: string | null;

  // Marketplace fields
  status?: string;
  pricing_model?: string;
  price_monthly?: number;
  price_one_time?: number;
  price_yearly?: number;
  setup_time_days?: number;

  demo_video_url?: string | null;
  demo_video_thumbnail?: string | null;
  is_featured?: boolean;

  avg_rating?: number;
  review_count?: number;
  orders?: number;
  views?: number;

  tagline?: string | null;
  description?: string | null;
  category?: string | null;

  integrations?: string[];
  use_cases?: string[];
  features?: string[];
  languages_supported?: string[];

  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  agent_id: string;

  // used in messages page
  buyer_id: string;
  builder_id: string;

  buyer_unread?: number;
  builder_unread?: number;
  last_message_at?: string;

  created_at?: string;
}

export interface Message {
  id: string;
  conversation_id: string;

  sender_id: string;
  message_type?: string;

  // offer-card messages referenced by OfferCard/ChatPopup
  offer_data?: {
    title?: string;
    description?: string;
    monthly_price?: number;
    platformFee?: number;
    totalPrice?: number;
  } | null;

  content?: string;
  role: 'user' | 'assistant' | 'system';
  created_at?: string;
}

export interface OfferCard {
  id: string;
  agent_id?: string;
  title: string;
  description?: string | null;
  monthly_price?: number;
  platformFee?: number;
  totalPrice?: number;
  created_at?: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  builder_id: string;
  order_status?: string;
  escrow_status?: string;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  due_date?: string | null;
  delivery_days?: number;
  deal_value?: number;
  created_at?: string;
}

export interface Deal {
  id: string;
  buyer_id: string;
  builder_id: string;
  offer_id?: string | null;
  deal_value: number;
  status?: string;
  created_at?: string;
}

export interface AgentFlowDiagram {

  nodes: Array<{
    id: string;
    type: string;
    content: string;
    position: { x: number; y: number };
  }>;
  edges: Array<{
    from: string;
    to: string;
    label: string;
  }>;
}

export interface GeneratedAgent {
  name: string;
  tagline?: string;
  description?: string;
  category?: string;
  use_cases?: string[];
  features?: string[];
  integrations?: string[];
  languages_supported?: string[];
  suggested_price_monthly?: number;
  conversation_flow: AgentFlowDiagram;
}

export interface StudioBuild {
  id: string;
  builder_id: string;
  agent_id?: string | null;

  agent_name?: string | null;
  prompt?: string | null;

  // referenced by studio page
  generated_flow_json?: unknown;
  config_json?: unknown;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DeployedAgent {
  id: string;
  builder_id: string;
  agent_id?: string | null;
  deployment_url?: string | null;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title?: string | null;
  message?: string | null;
  is_read?: boolean;
  read?: boolean;
  created_at?: string;
}

export interface Review {
  id: string;
  builder_id: string;
  user_id: string;
  rating: number;
  title?: string | null;
  content?: string | null;
  comment?: string | null;
  created_at?: string;
}

export interface Filter {
  query?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
}

export interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  description?: string | null;
  features?: string[];
}

// additional referenced plan-ish types
export interface PlatformFeeBreakdown {
  dealValue: number;
  platformFee: number;
  gst: number;
  total: number;
}

export interface ChatSession {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar: string | null;
  lastMessageAt?: string;
  isVerified?: boolean;
  responseTimeHours?: number;
  isMinimised?: boolean;
}


