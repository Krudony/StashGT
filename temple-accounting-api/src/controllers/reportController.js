import db from '../config/database.js';
import { dbHelpers } from '../utils/dbHelpers.js';

export const getSummary = async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month');

    if (!month) {
      return c.json({ error: 'Month is required (format: YYYY-MM)' }, 400);
    }

    const summary = dbHelpers.getSummary(db, userId, month);
    return c.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const getDetailedReport = async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month');

    if (!month) {
      return c.json({ error: 'Month is required (format: YYYY-MM)' }, 400);
    }

    // Get summary
    const summaryStmt = db.prepare(`
      SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
       FROM transactions
       WHERE user_id = ? AND strftime('%Y-%m', date) = ?
    `);
    const summary = summaryStmt.get(userId, month);

    // Get detailed transactions
    const transactionsStmt = db.prepare(`
      SELECT
        t.id, t.type, t.amount, t.date, t.description, t.details,
        c.name as category_name
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND strftime('%Y-%m', t.date) = ?
       ORDER BY t.date DESC, t.created_at DESC
    `);
    const transactions = transactionsStmt.all(userId, month);

    const totalIncome = parseFloat(summary.total_income) || 0;
    const totalExpense = parseFloat(summary.total_expense) || 0;

    return c.json({
      month,
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: totalIncome - totalExpense
      },
      transactions
    });
  } catch (error) {
    console.error('Get detailed report error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const exportPDF = async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month');
    const format = c.req.query('format') || 'summary';

    if (!month) {
      return c.json({ error: 'Month is required (format: YYYY-MM)' }, 400);
    }

    // For now, return JSON with export data
    // PDF generation will be implemented later
    return c.json({
      message: 'PDF export endpoint',
      month,
      format,
      status: 'coming soon'
    });
  } catch (error) {
    console.error('Export PDF error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const exportExcel = async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month');
    const format = c.req.query('format') || 'summary';

    if (!month) {
      return c.json({ error: 'Month is required (format: YYYY-MM)' }, 400);
    }

    // For now, return JSON with export data
    // Excel generation will be implemented later
    return c.json({
      message: 'Excel export endpoint',
      month,
      format,
      status: 'coming soon'
    });
  } catch (error) {
    console.error('Export Excel error:', error);
    return c.json({ error: error.message }, 500);
  }
};
