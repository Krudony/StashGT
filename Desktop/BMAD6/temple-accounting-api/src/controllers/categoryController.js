import pool from '../config/database.js';

export const getCategories = async (c) => {
  try {
    const userId = c.get('userId');

    const result = await pool.query(
      'SELECT id, name, type, is_default, created_at FROM categories WHERE user_id = $1 ORDER BY type, name',
      [userId]
    );

    return c.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const createCategory = async (c) => {
  try {
    const userId = c.get('userId');
    const { name, type } = await c.req.json();

    // Validate input
    if (!name || !type) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['income', 'expense'].includes(type)) {
      return c.json({ error: 'Invalid type' }, 400);
    }

    // Check if category already exists
    const existing = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1 AND name = $2',
      [userId, name]
    );

    if (existing.rows.length > 0) {
      return c.json({ error: 'Category already exists' }, 400);
    }

    const result = await pool.query(
      'INSERT INTO categories (user_id, name, type, is_default) VALUES ($1, $2, $3, $4) RETURNING id, name, type, is_default, created_at',
      [userId, name, type, false]
    );

    return c.json(result.rows[0], 201);
  } catch (error) {
    console.error('Create category error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const updateCategory = async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const { name } = await c.req.json();

    if (!name) {
      return c.json({ error: 'Name is required' }, 400);
    }

    // Verify category belongs to user
    const categoryCheck = await pool.query(
      'SELECT id, is_default FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (categoryCheck.rows.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Cannot edit default categories
    if (categoryCheck.rows[0].is_default) {
      return c.json({ error: 'Cannot edit default categories' }, 400);
    }

    const result = await pool.query(
      'UPDATE categories SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND user_id = $3 RETURNING id, name, type, is_default, created_at',
      [name, id, userId]
    );

    return c.json(result.rows[0]);
  } catch (error) {
    console.error('Update category error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const deleteCategory = async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    // Verify category belongs to user
    const categoryCheck = await pool.query(
      'SELECT id, is_default FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (categoryCheck.rows.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Cannot delete default categories
    if (categoryCheck.rows[0].is_default) {
      return c.json({ error: 'Cannot delete default categories' }, 400);
    }

    // Check if category has transactions
    const transactionCount = await pool.query(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = $1',
      [id]
    );

    if (transactionCount.rows[0].count > 0) {
      return c.json({ error: 'Cannot delete category with transactions' }, 400);
    }

    await pool.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return c.json({ error: error.message }, 500);
  }
};
