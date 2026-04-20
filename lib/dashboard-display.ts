import type { SupabaseClient } from "@supabase/supabase-js";

/** Resolve `builder_profiles.id` → display name via linked `profiles`. */
export async function mapBuilderProfileIdsToNames(
  supabase: SupabaseClient,
  builderProfileIds: string[]
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(builderProfileIds.filter(Boolean)));
  if (unique.length === 0) return new Map();

  const { data: bps } = await supabase
    .from("builder_profiles")
    .select("id, user_id")
    .in("id", unique);
  const userIds = Array.from(new Set((bps ?? []).map((b) => b.user_id)));
  if (userIds.length === 0) return new Map();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const nameByUserId = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name?.trim() || "Builder"])
  );
  const out = new Map<string, string>();
  for (const bp of bps ?? []) {
    out.set(bp.id, nameByUserId.get(bp.user_id) ?? "Builder");
  }
  return out;
}

/** Resolve `profiles.id` → display name. */
export async function mapProfileIdsToNames(
  supabase: SupabaseClient,
  profileIds: string[]
): Promise<Map<string, string>> {
  const unique = Array.from(new Set(profileIds.filter(Boolean)));
  if (unique.length === 0) return new Map();

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);

  return new Map(
    (data ?? []).map((p) => [p.id, p.full_name?.trim() || "User"])
  );
}
