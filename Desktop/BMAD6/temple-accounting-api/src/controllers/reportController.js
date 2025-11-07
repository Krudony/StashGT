import pool from '../config/database.js';

export const getSummary = async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month');

    if (!month) {
      return c.json({ error: 'Month is required (format: YYYY-MM)' }, 400);
    }

    // Get total income
    const incomeResult = await pool.query(
      `SELECT SUM(amount) as total FROM transactions
       WHERE user_id = $1 AND type = 'income'
       AND DATE_TRUNC('month', date) = $2`,
      [userId, `${month}-01`]
    );

    // Get total expense
    const expenseResult = await pool.query(
      `SELECT SUM(amount) as total FROM transactions
       WHERE user_id = $1 AND type = 'expense'
       AND DATE_TRUNC('month', date) = $2`,
      [userId, `${month}-01`]
    );

    // Get by category
    const byCategoryResult = await pool.query(
      `SELECT
        c.id, c.name, c.type,
        SUM(t.amount) as total,
        COUNT(t.id) as count
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1
       AND DATE_TRUNC('month', t.date) = $2
       GROUP BY c.id, c.name, c.type
       ORDER BY c.type, total DESC`,
      [userId, `${month}-01`]
    );

    const totalIncome = parseFloat(incomeResult.rows[0]?.total) || 0;
    const totalExpense = parseFloat(expenseResult.rows[0]?.total) || 0;
    const balance = totalIncome - totalExpense;

    return c.json({
      month,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance,
      by_category: byCategoryResult.rows
    });
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
    const summaryResult = await pool.query(
      `SELECT
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
       FROM transactions
       WHERE user_id = $1 AND DATE_TRUNC('month', date) = $2`,
      [userId, `${month}-01`]
    );

    // Get detailed transactions
    const transactionsResult = await pool.query(
      `SELECT
        t.id, t.type, t.amount, t.date, t.description, t.details,
        c.name as category_name
       FROM transactions t
       JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = $1 AND DATE_TRUNC('month', t.date) = $2
       ORDER BY t.date DESC, t.created_at DESC`,
      [userId, `${month}-01`]
    );

    const summary = summaryResult.rows[0];
    const totalIncome = parseFloat(summary.total_income) || 0;
    const totalExpense = parseFloat(summary.total_expense) || 0;

    return c.json({
      month,
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: totalIncome - totalExpense
      },
      transactions: transactionsResult.rows
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
