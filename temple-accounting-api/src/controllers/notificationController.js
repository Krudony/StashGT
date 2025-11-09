import db from '../config/database.js';
import { dbHelpers } from '../utils/dbHelpers.js';

export const getNotifications = async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit')) || 20;
    const offset = parseInt(c.req.query('offset')) || 0;

    const notifications = dbHelpers.getNotifications(db, userId, limit, offset);
    const countResult = dbHelpers.countNotifications(db, userId);

    return c.json({
      notifications,
      total: countResult.total,
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

    const notification = db.prepare(
      'SELECT id, message, type, is_read, created_at FROM notifications WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!notification) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    dbHelpers.markNotificationAsRead(db, id, userId);

    return c.json({
      id,
      message: notification.message,
      type: notification.type,
      is_read: 1,
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

    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);

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

    const result = db.prepare(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?'
    ).run(id, userId);

    if (result.changes === 0) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ error: error.message }, 500);
  }
};
