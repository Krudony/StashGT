import pool from '../config/database.js';

export const getNotifications = async (c) => {
  try {
    const userId = c.get('userId');
    const limit = parseInt(c.req.query('limit')) || 20;
    const offset = parseInt(c.req.query('offset')) || 0;

    const result = await pool.query(
      `SELECT id, message, type, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = $1',
      [userId]
    );

    return c.json({
      notifications: result.rows,
      total: parseInt(countResult.rows[0].total),
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

    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING id, message, type, is_read, created_at',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json(result.rows[0]);
  } catch (error) {
    console.error('Mark as read error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const markAllAsRead = async (c) => {
  try {
    const userId = c.get('userId');

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [userId]
    );

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

    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    return c.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return c.json({ error: error.message }, 500);
  }
};
