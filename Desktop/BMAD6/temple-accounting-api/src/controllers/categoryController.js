import db from '../config/database.js';
import { dbHelpers } from '../utils/dbHelpers.js';

export const getCategories = async (c) => {
  try {
    const userId = c.get('userId');
    const categories = dbHelpers.getCategories(db, userId);
    return c.json(categories);
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

    // Check if category already exists (dbHelpers handles this via UNIQUE constraint)
    try {
      const result = dbHelpers.createCategory(db, userId, name, type);
      return c.json({
        id: result.lastInsertRowid,
        name,
        type,
        is_default: 0,
        created_at: new Date().toISOString()
      }, 201);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return c.json({ error: 'Category already exists' }, 400);
      }
      throw err;
    }
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

    // Verify category belongs to user and check if default
    const category = db.prepare(
      'SELECT id, is_default FROM categories WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Cannot edit default categories
    if (category.is_default) {
      return c.json({ error: 'Cannot edit default categories' }, 400);
    }

    dbHelpers.updateCategory(db, id, userId, name);

    return c.json({
      id,
      name,
      type: db.prepare('SELECT type FROM categories WHERE id = ?').get(id).type,
      is_default: 0,
      updated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update category error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const deleteCategory = async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    // Verify category belongs to user and check if default
    const category = db.prepare(
      'SELECT id, is_default FROM categories WHERE id = ? AND user_id = ?'
    ).get(id, userId);

    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Cannot delete default categories
    if (category.is_default) {
      return c.json({ error: 'Cannot delete default categories' }, 400);
    }

    // Check if category has transactions
    const transactionCount = db.prepare(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = ?'
    ).get(id);

    if (transactionCount.count > 0) {
      return c.json({ error: 'Cannot delete category with transactions' }, 400);
    }

    dbHelpers.deleteCategory(db, id, userId);

    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return c.json({ error: error.message }, 500);
  }
};
