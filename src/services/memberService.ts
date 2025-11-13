import { createClient } from "@/lib/supabase/client";
import type { CommunityMember } from "@/lib/types";

export async function joinCommunity(
  communityId: string,
  userId: string
): Promise<CommunityMember> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("community_members")
    .insert({
      community_id: communityId,
      user_id: userId,
      role: "member",
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.rpc("increment_member_count", {
    community_id_param: communityId,
  });

  return data;
}

export async function leaveCommunity(
  communityId: string,
  userId: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .eq("role", "member");

  if (error) throw error;

  await supabase.rpc("decrement_member_count", {
    community_id_param: communityId,
  });
}

export async function checkMembership(
  communityId: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("community_members")
    .select("id")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function getCommunityMembers(
  communityId: string
): Promise<CommunityMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("community_members")
    .select("*")
    .eq("community_id", communityId)
    .order("joined_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPublicCommunities(
  category?: string,
  searchQuery?: string
): Promise<any[]> {
  const supabase = createClient();

  let query = supabase
    .from("communities")
    .select("*")
    .eq("is_public", true)
    .order("member_count", { ascending: false });

  if (category && category !== "all") {
    query = query.eq("category", category);
  }

  if (searchQuery) {
    query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

export async function getUserCommunities(userId: string): Promise<string[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data || []).map((m) => m.community_id);
}
