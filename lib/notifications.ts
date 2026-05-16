import type { Notification } from '@/types';
import { createClient } from '@/lib/supabase/client';

export type NotificationType = 'message' | 'payment' | 'offer' | 'deal' | 'system';

export async function createNotification({
  userId,
  title,
  message,
  type,
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string | null;
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const supabase = createClient();

    // NOTE: table columns in this repo use snake_case: user_id, title, message, type, link, is_read
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link: link ?? null,
      is_read: false,
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to create notification' };
  }
}

export async function fetchNotificationsForUser(userId: string): Promise<Notification[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  return (data || []) as Notification[];
}

