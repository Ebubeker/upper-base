import { createClient } from "@/lib/supabase/client";
import { generateSlug } from "@/lib/utils";
import type { Community, CommunityModule, ModuleType } from "@/lib/types";

export async function getCommunities(userId: string): Promise<Community[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("owner_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCommunity(id: string): Promise<Community | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCommunity(
  name: string,
  description: string,
  userId: string,
  category: string = "general",
  isPublic: boolean = false,
  isPaid: boolean = false,
  price?: number
): Promise<Community> {
  const supabase = createClient();
  const slug = generateSlug(name);

  const { data, error} = await supabase
    .from("communities")
    .insert({
      name,
      description,
      slug,
      owner_id: userId,
      category,
      is_public: isPublic,
      is_paid: isPaid,
      price,
      custom_module_names: {},
      member_count: 0,
    })
    .select()
    .single();

  if (error) throw error;

  const defaultModules: ModuleType[] = ["chat", "notes", "tasks"];
  for (const moduleType of defaultModules) {
    await supabase.from("community_modules").insert({
      community_id: data.id,
      module_type: moduleType,
      is_enabled: true,
      config: {},
    });
  }

  return data;
}

export async function updateCommunity(
  id: string,
  updates: Partial<Community>
): Promise<Community> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("communities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCommunity(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("communities").delete().eq("id", id);

  if (error) throw error;
}

export async function getCommunityModules(
  communityId: string
): Promise<CommunityModule[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("community_modules")
    .select("*")
    .eq("community_id", communityId);

  if (error) throw error;
  return data || [];
}

export async function toggleModule(
  moduleId: string,
  isEnabled: boolean
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("community_modules")
    .update({ is_enabled: isEnabled })
    .eq("id", moduleId);

  if (error) throw error;
}
