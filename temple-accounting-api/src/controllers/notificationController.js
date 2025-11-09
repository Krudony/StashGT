import { supabase } from '../config/supabase.js';

export const getNotifications = async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit')) || 20;
    const offset = parseInt(c.req.query('offset')) || 0;

    // Get notifications with pagination
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, message, type, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (notificationsError) throw notificationsError;

    // Get total count
    const { count, error: countError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    return c.json({
      notifications: notifications || [],
      total: count || 0,
      limit,
      offset
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const markAsRead = async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    // First, check if notification exists and belongs to user
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('id, message, type, is_read, created_at')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    // Update notification to mark as read
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return c.json({
      id,
      message: notification.message,
      type: notification.type,
      is_read: true,
      created_at: notification.created_at
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const markAllAsRead = async (c) => {
  try {
    const userId = c.get('userId');

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) throw error;

    return c.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const deleteNotification = async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // Check if any rows were affected by trying to fetch the deleted notification
    const { data: checkDeleted } = await supabase
      .from('notifications')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (checkDeleted) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ error: error.message }, 500);
  }
};
