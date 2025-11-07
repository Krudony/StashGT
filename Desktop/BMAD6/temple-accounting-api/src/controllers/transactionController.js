import db from '../config/database.js';
import { dbHelpers } from '../utils/dbHelpers.js';

export const getTransactions = async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month');
    const categoryId = c.req.query('category');
    const type = c.req.query('type');

    const transactions = dbHelpers.getTransactions(db, userId, month, categoryId, type);
    return c.json(transactions);
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
    const category = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).get(category_id, userId);

    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    const result = dbHelpers.createTransaction(db, {
      user_id: userId,
      category_id,
      type,
      amount,
      date,
      description,
      details
    });

    return c.json({
      id: result.lastInsertRowid,
      user_id: userId,
      category_id,
      type,
      amount,
      date,
      description,
      details
    }, 201);
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
    const transaction = db.prepare(
      'SELECT id FROM transactions WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!transaction) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    // Verify category belongs to user
    const category = db.prepare(
      'SELECT id FROM categories WHERE id = ? AND user_id = ?'
    ).get(category_id, userId);

    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    dbHelpers.updateTransaction(db, id, userId, {
      type,
      category_id,
      amount,
      date,
      description,
      details
    });

    return c.json({
      id,
      user_id: userId,
      category_id,
      type,
      amount,
      date,
      description,
      details
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const deleteTransaction = async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const result = dbHelpers.deleteTransaction(db, id, userId);

    if (result.changes === 0) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return c.json({ error: error.message }, 500);
  }
};
