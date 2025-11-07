/**
 * Database Helper Functions
 * Simplifies SQLite queries
 */

export const dbHelpers = {
  // Transactions
  getTransactions(db, userId, month = null, categoryId = null, type = null) {
    let query = `
      SELECT
        t.id, t.user_id, t.category_id, t.type, t.amount, t.date,
        t.description, t.details, t.created_at, t.updated_at,
        c.name as category_name
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    if (month) {
      query += ` AND strftime('%Y-%m', t.date) = ?`;
      params.push(month);
    }

    if (categoryId) {
      query += ` AND t.category_id = ?`;
      params.push(categoryId);
    }

    if (type) {
      query += ` AND t.type = ?`;
      params.push(type);
    }

    query += ' ORDER BY t.date DESC, t.created_at DESC';

    return db.prepare(query).all(...params);
  },

  createTransaction(db, data) {
    const stmt = db.prepare(`
      INSERT INTO transactions (user_id, category_id, type, amount, date, description, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      data.user_id,
      data.category_id,
      data.type,
      data.amount,
      data.date,
      data.description || null,
      data.details ? JSON.stringify(data.details) : null
    );
  },

  updateTransaction(db, id, userId, data) {
    const stmt = db.prepare(`
      UPDATE transactions
      SET type = ?, category_id = ?, amount = ?, date = ?, description = ?, details = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);
    return stmt.run(
      data.type,
      data.category_id,
      data.amount,
      data.date,
      data.description || null,
      data.details ? JSON.stringify(data.details) : null,
      id,
      userId
    );
  },

  deleteTransaction(db, id, userId) {
    const stmt = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?');
    return stmt.run(id, userId);
  },

  // Categories
  getCategories(db, userId) {
    const stmt = db.prepare(
      'SELECT id, name, type, is_default, created_at FROM categories WHERE user_id = ? ORDER BY type, name'
    );
    return stmt.all(userId);
  },

  createCategory(db, userId, name, type) {
    const stmt = db.prepare(
      'INSERT INTO categories (user_id, name, type, is_default) VALUES (?, ?, ?, ?)'
    );
    return stmt.run(userId, name, type, 0);
  },

  updateCategory(db, id, userId, name) {
    const stmt = db.prepare(
      'UPDATE categories SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
    );
    return stmt.run(name, id, userId);
  },

  deleteCategory(db, id, userId) {
    const stmt = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?');
    return stmt.run(id, userId);
  },

  // Reports
  getSummary(db, userId, month) {
    const incomeStmt = db.prepare(`
      SELECT SUM(amount) as total FROM transactions
      WHERE user_id = ? AND type = 'income'
      AND strftime('%Y-%m', date) = ?
    `);
    const income = incomeStmt.get(userId, month);

    const expenseStmt = db.prepare(`
      SELECT SUM(amount) as total FROM transactions
      WHERE user_id = ? AND type = 'expense'
      AND strftime('%Y-%m', date) = ?
    `);
    const expense = expenseStmt.get(userId, month);

    const byCategoryStmt = db.prepare(`
      SELECT
        c.id, c.name, c.type,
        SUM(t.amount) as total,
        COUNT(t.id) as count
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.user_id = ?
      AND strftime('%Y-%m', t.date) = ?
      GROUP BY c.id, c.name, c.type
      ORDER BY c.type, total DESC
    `);
    const byCategory = byCategoryStmt.all(userId, month);

    const totalIncome = income.total || 0;
    const totalExpense = expense.total || 0;

    return {
      month,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
      by_category: byCategory
    };
  },

  // Notifications
  getNotifications(db, userId, limit = 20, offset = 0) {
    const stmt = db.prepare(`
      SELECT id, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(userId, limit, offset);
  },

  countNotifications(db, userId) {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM notifications WHERE user_id = ?');
    return stmt.get(userId);
  },

  markNotificationAsRead(db, id, userId) {
    const stmt = db.prepare(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?'
    );
    return stmt.run(id, userId);
  }
};
