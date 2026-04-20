import type { User as SupabaseUser } from "@supabase/supabase-js";

/** Application user roles stored on `profiles.role`. */
export type UserRole = "business" | "builder" | "admin";

/** Supabase auth user — re-export pattern for app code. */
export type AuthUser = SupabaseUser;

/** Row shape for `public.profiles` (matches DB + Supabase typings). */
export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  language: string;
  created_at: string;
}

/** Public-facing profile fields for marketplace cards. */
export type PublicProfile = Pick<
  Profile,
  "id" | "full_name" | "avatar_url" | "role" | "bio" | "location"
>;

export type VerificationStatus = "pending" | "approved" | "rejected";

export type SubscriptionPlanKey = "free" | "starting" | "medium" | "business";

export type SubscriptionStatus =
  | "inactive"
  | "active"
  | "past_due"
  | "cancelled";

/** Row shape for `public.builder_profiles`. */
export interface BuilderProfile {
  id: string;
  user_id: string;
  specialty: string[] | null;
  is_verified: boolean;
  verification_status: VerificationStatus;
  vetting_score: number;
  subscription_plan: SubscriptionPlanKey;
  subscription_status: SubscriptionStatus;
  razorpay_subscription_id: string | null;
  availability_slots: Record<string, unknown>;
  zoom_user_id: string | null;
  total_completed_deals: number;
  average_rating: number;
  is_active: boolean;
  created_at: string;
}

export type AgentType = "website" | "ai_agent";

/** Row shape for `public.agents`. */
export interface Agent {
  id: string;
  builder_id: string;
  title: string;
  description: string | null;
  category: string | null;
  agent_type: AgentType | null;
  generated_code: string | null;
  flow_json: AgentFlowJson | null;
  price: number;
  demo_url: string | null;
  preview_image_url: string | null;
  tags: string[] | null;
  language_support: string[] | null;
  is_published: boolean;
  is_featured: boolean;
  total_purchases: number;
  average_rating: number;
  created_at: string;
}

export type DemoBookingStatus =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";

/** Row shape for `public.demo_bookings`. */
export interface DemoBooking {
  id: string;
  business_id: string;
  builder_id: string;
  agent_id: string | null;
  scheduled_at: string;
  zoom_meeting_id: string | null;
  zoom_join_url: string | null;
  zoom_start_url: string | null;
  status: DemoBookingStatus;
  notes: string | null;
  created_at: string;
}

/** Row shape for `public.conversations`. */
export interface Conversation {
  id: string;
  business_id: string | null;
  builder_id: string | null;
  project_id: string | null;
  last_message_at: string;
  created_at: string;
}

export type MessageType = "text" | "file" | "system";

/** Row shape for `public.messages`. */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  file_url: string | null;
  is_read: boolean;
  created_at: string;
}

export type ProjectType = "agent_purchase" | "custom_hire";

export type ProjectStatus =
  | "inquiry"
  | "negotiation"
  | "active"
  | "in_review"
  | "completed"
  | "disputed"
  | "cancelled";

/** Row shape for `public.projects`. */
export interface Project {
  id: string;
  business_id: string;
  builder_id: string;
  agent_id: string | null;
  title: string;
  description: string | null;
  project_type: ProjectType;
  total_amount: number | null;
  platform_commission: number | null;
  builder_payout: number | null;
  status: ProjectStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export type MilestoneStatus = "pending" | "submitted" | "approved" | "rejected";

/** Row shape for `public.milestones`. */
export interface Milestone {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  amount: number | null;
  due_date: string | null;
  status: MilestoneStatus;
  submission_notes: string | null;
  submission_files: string[] | null;
  approved_at: string | null;
  created_at: string;
}

/** Row shape for `public.reviews`. */
export interface Review {
  id: string;
  project_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  is_verified_purchase: boolean;
  created_at: string;
}

export type DisputeStatus = "open" | "under_review" | "resolved" | "dismissed";

/** Row shape for `public.disputes`. */
export interface Dispute {
  id: string;
  project_id: string;
  raised_by: string;
  reason: string | null;
  evidence_files: string[] | null;
  status: DisputeStatus;
  admin_notes: string | null;
  resolved_at: string | null;
  created_at: string;
}

export type StudioBuildType = "website" | "ai_agent";

/** Row shape for `public.studio_builds`. */
export interface StudioBuild {
  id: string;
  builder_id: string;
  build_name: string | null;
  build_type: StudioBuildType;
  prompt_used: string | null;
  generated_code: string | null;
  flow_json: AgentFlowJson | null;
  conversation_history: StudioConversationTurn[];
  saved_to_profile: boolean;
  created_at: string;
}

/** One turn in studio chat stored in JSONB. */
export interface StudioConversationTurn {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

/** Intent from `detectIntent` / studio API. */
export type StudioIntent = "website" | "agent" | "unclear";

/** Node types for agent flow builder (matches Part 4 spec). */
export type AgentFlowNodeType =
  | "trigger"
  | "condition"
  | "action"
  | "ai"
  | "output";

export type AgentTriggerType =
  | "whatsapp"
  | "voice"
  | "webhook"
  | "schedule"
  | "form";

/** Parsed Gemini JSON for agent mode (Part 4). */
export interface AgentFlowNode {
  id: string;
  type: AgentFlowNodeType;
  label: string;
  description: string;
  config: Record<string, unknown>;
}

export interface AgentFlowConnection {
  from: string;
  to: string;
  label?: string;
}

export interface AgentFlowJson {
  agentName: string;
  description: string;
  triggerType: AgentTriggerType;
  nodes: AgentFlowNode[];
  connections: AgentFlowConnection[];
  capabilities: string[];
  deploymentChannels: string[];
}

/** SSE events from `/api/studio/generate` (discriminated by `type`). */
export type StudioStreamEvent =
  | { type: "intent"; intent: StudioIntent }
  | { type: "text_delta"; text: string }
  | { type: "website_html"; html: string }
  | { type: "agent_flow"; flow: AgentFlowJson }
  | { type: "error"; message: string }
  | { type: "done" };

/** Razorpay subscription plan keys used in payments API. */
export type RazorpaySubscriptionPlanId = "starting" | "medium" | "business";

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status?: string;
}

/** Paginated API list responses. */
export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

/** Conversation list item for messaging UI. */
export interface ConversationListItem {
  conversation: Conversation;
  otherParticipant: PublicProfile;
  lastMessage: Message | null;
  unreadCount: number;
}

/** Category card on landing / marketplace filters. */
export interface CategoryDefinition {
  id: string;
  name: string;
  agentCount: number;
  gradientClass: string;
}

/** Featured agent card props (landing). */
export interface FeaturedAgentCardData {
  id: string;
  title: string;
  description: string;
  category: string;
  priceInr: number;
  rating: number;
  reviewCount: number;
  builderName: string;
  builderVerified: boolean;
}

/** Availability slot for demo booking (derived from JSONB). */
export interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
}

/** Zoom meeting creation response (subset of Zoom API). */
export interface ZoomMeetingCreated {
  id: string;
  join_url: string;
  start_url: string;
}

/** Notification payload for in-app + realtime. */
export interface AppNotification {
  id: string;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}
