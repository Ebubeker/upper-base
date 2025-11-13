import { createClient } from "@/lib/supabase/client";
import type { Note, Task, ChatMessage } from "@/lib/types";

export async function getNotes(communityId: string): Promise<Note[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createNote(
  communityId: string,
  userId: string,
  title: string,
  content: string
): Promise<Note> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("notes")
    .insert({
      community_id: communityId,
      user_id: userId,
      title,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(
  id: string,
  title: string,
  content: string
): Promise<Note> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("notes")
    .update({ title, content })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("notes").delete().eq("id", id);

  if (error) throw error;
}

export async function getTasks(communityId: string): Promise<Task[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createTask(
  communityId: string,
  userId: string,
  title: string,
  description?: string,
  dueDate?: string
): Promise<Task> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      community_id: communityId,
      user_id: userId,
      title,
      description,
      due_date: dueDate,
      is_completed: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleTask(
  id: string,
  isCompleted: boolean
): Promise<Task> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("tasks")
    .update({ is_completed: isCompleted })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) throw error;
}

export async function getChatMessages(
  communityId: string
): Promise<ChatMessage[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("community_id", communityId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function sendMessage(
  communityId: string,
  userId: string,
  content: string
): Promise<ChatMessage> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      community_id: communityId,
      user_id: userId,
      content,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}
