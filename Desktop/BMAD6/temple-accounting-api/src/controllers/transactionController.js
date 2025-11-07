import pool from '../config/database.js';

export const getTransactions = async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month');
    const categoryId = c.req.query('category');
    const type = c.req.query('type');

    let query = `
      SELECT
        t.id, t.user_id, t.category_id, t.type, t.amount, t.date,
        t.description, t.details, t.created_at, t.updated_at,
        c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = $1
    `;
    const params = [userId];

    if (month) {
      query += ` AND DATE_TRUNC('month', t.date) = $${params.length + 1}`;
      params.push(`${month}-01`);
    }

    if (categoryId) {
      query += ` AND t.category_id = $${params.length + 1}`;
      params.push(categoryId);
    }

    if (type) {
      query += ` AND t.type = $${params.length + 1}`;
      params.push(type);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    const result = await pool.query(query, params);
    return c.json(result.rows);
  } catch (error) {
    console.error('Get transactions error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const createTransaction = async (c) => {
  try {
    const userId = c.get('userId');
    const { type, category_id, amount, date, description, details } = await c.req.json();

    // Validate input
    if (!type || !category_id || !amount || !date) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (!['income', 'expense'].includes(type)) {
      return c.json({ error: 'Invalid type' }, 400);
    }

    // Verify category belongs to user
    const categoryCheck = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [category_id, userId]
    );

    if (categoryCheck.rows.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, category_id, type, amount, date, description, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, category_id, type, amount, date, description, details, created_at, updated_at`,
      [userId, category_id, type, amount, date, description || null, details || null]
    );

    return c.json(result.rows[0], 201);
  } catch (error) {
    console.error('Create transaction error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const updateTransaction = async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');
    const { type, category_id, amount, date, description, details } = await c.req.json();

    // Validate input
    if (!type || !category_id || !amount || !date) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Verify transaction belongs to user
    const transactionCheck = await pool.query(
      'SELECT id FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (transactionCheck.rows.length === 0) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Verify category belongs to user
    const categoryCheck = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [category_id, userId]
    );

    if (categoryCheck.rows.length === 0) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const result = await pool.query(
      `UPDATE transactions
       SET type = $1, category_id = $2, amount = $3, date = $4, description = $5, details = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND user_id = $8
       RETURNING id, user_id, category_id, type, amount, date, description, details, created_at, updated_at`,
      [type, category_id, amount, date, description || null, details || null, id, userId]
    );

    return c.json(result.rows[0]);
  } catch (error) {
    console.error('Update transaction error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const deleteTransaction = async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const result = await pool.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return c.json({ error: error.message }, 500);
  }
};
