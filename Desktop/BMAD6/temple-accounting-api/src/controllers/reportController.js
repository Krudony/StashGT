import supabase from '../config/supabase.js';

export const getSummary = async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month');

    if (!month) {
      return c.json({ error: 'Month is required (format: YYYY-MM)' }, 400);
    }

    // Get income total
    const { data: incomeData, error: incomeError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'income')
      .filter('date', 'gte', `${month}-01`)
      .filter('date', 'lt', `${month}-32`);

    if (incomeError) throw incomeError;

    // Get expense total
    const { data: expenseData, error: expenseError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'expense')
      .filter('date', 'gte', `${month}-01`)
      .filter('date', 'lt', `${month}-32`);

    if (expenseError) throw expenseError;

    // Get summary by category
    const { data: categoryData, error: categoryError } = await supabase
      .rpc('get_summary_by_category', {
        p_user_id: userId,
        p_month: month
      });

    if (categoryError) throw categoryError;

    const totalIncome = incomeData.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpense = expenseData.reduce((sum, t) => sum + parseFloat(t.amount), 0);

    return c.json({
      month,
      total_income: totalIncome,
      total_expense: totalExpense,
      balance: totalIncome - totalExpense,
      by_category: categoryData || []
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

    // Get summary using PostgreSQL date filtering
    const { data: summaryData, error: summaryError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .filter('date', 'gte', `${month}-01`)
      .filter('date', 'lt', `${month}-32`);

    if (summaryError) throw summaryError;

    // Calculate totals
    const totalIncome = summaryData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = summaryData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Get detailed transactions with category names
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        date,
        description,
        details,
        categories!inner(name)
      `)
      .eq('user_id', userId)
      .filter('date', 'gte', `${month}-01`)
      .filter('date', 'lt', `${month}-32`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (transactionsError) throw transactionsError;

    // Transform the response to match expected format
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      description: tx.description,
      details: tx.details,
      category_name: tx.categories.name
    }));

    return c.json({
      month,
      summary: {
        total_income: totalIncome,
        total_expense: totalExpense,
        balance: totalIncome - totalExpense
      },
      transactions: formattedTransactions
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

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return c.json({ error: 'Invalid month format. Use YYYY-MM' }, 400);
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, temple_name')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get report data
    const { data: summaryData, error: summaryError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .filter('date', 'gte', `${month}-01`)
      .filter('date', 'lt', `${month}-32`);

    if (summaryError) throw summaryError;

    const totalIncome = summaryData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = summaryData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const balance = totalIncome - totalExpense;

    // Get transactions for detailed export
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        date,
        description,
        categories!inner(name)
      `)
      .eq('user_id', userId)
      .filter('date', 'gte', `${month}-01`)
      .filter('date', 'lt', `${month}-32`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (transactionsError) throw transactionsError;

    const transactions = transactionsData.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      description: tx.description,
      category_name: tx.categories.name
    }));

    // Generate PDF
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();

    // Set response headers
    c.header('Content-Type', 'application/pdf');
    c.header('Content-Disposition', `attachment; filename="report-${month}.pdf"`);

    // Add content to PDF
    doc.fontSize(16).text('Temple Accounting Report', { align: 'center' });
    doc.fontSize(12).text(`Temple: ${user.temple_name}`, { align: 'center' });
    doc.fontSize(12).text(`Month: ${month}`, { align: 'center' });
    doc.moveDown();

    // Summary section
    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(11);
    doc.text(`Total Income: ฿${totalIncome.toFixed(2)}`, { color: '008000' });
    doc.text(`Total Expense: ฿${totalExpense.toFixed(2)}`, { color: 'FF0000' });
    doc.text(`Balance: ฿${balance.toFixed(2)}`, {
      color: balance >= 0 ? '008000' : 'FF0000',
      underline: true
    });
    doc.moveDown();

    // Transactions section
    if (format === 'detailed' && transactions.length > 0) {
      doc.fontSize(14).text('Transactions', { underline: true });
      doc.fontSize(10);

      // Create table
      doc.text('Date | Category | Type | Amount | Description', {
        underline: true,
        font: 'Courier'
      });

      transactions.forEach(tx => {
        const dateStr = new Date(tx.date).toLocaleDateString('th-TH');
        const typeStr = tx.type === 'income' ? 'INC' : 'EXP';
        const amountStr = `฿${tx.amount.toFixed(2)}`;
        const desc = tx.description || '-';
        doc.text(`${dateStr} | ${tx.category_name} | ${typeStr} | ${amountStr} | ${desc}`, {
          font: 'Courier'
        });
      });
    }

    doc.moveDown();
    doc.fontSize(9).text(`Generated: ${new Date().toLocaleString('th-TH')}`, { align: 'right' });

    // Pipe to response
    doc.pipe(c.raw.socket);
    doc.end();

    return;
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

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return c.json({ error: 'Invalid month format. Use YYYY-MM' }, 400);
    }

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('username, temple_name')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get report data
    const { data: summaryData, error: summaryError } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .filter('date', 'gte', `${month}-01`)
      .filter('date', 'lt', `${month}-32`);

    if (summaryError) throw summaryError;

    const totalIncome = summaryData
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = summaryData
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const balance = totalIncome - totalExpense;

    // Get transactions for detailed export
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select(`
        id,
        type,
        amount,
        date,
        description,
        categories!inner(name)
      `)
      .eq('user_id', userId)
      .filter('date', 'gte', `${month}-01`)
      .filter('date', 'lt', `${month}-32`)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (transactionsError) throw transactionsError;

    const transactions = transactionsData.map(tx => ({
      id: tx.id,
      type: tx.type,
      amount: tx.amount,
      date: tx.date,
      description: tx.description,
      category_name: tx.categories.name
    }));

    // Generate Excel
    const XLSX = require('xlsx');

    // Create workbook and worksheets
    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Temple Accounting Report'],
      [''],
      ['Temple:', user.temple_name],
      ['Month:', month],
      ['Generated:', new Date().toLocaleString('th-TH')],
      [''],
      ['Summary'],
      ['Total Income', totalIncome],
      ['Total Expense', totalExpense],
      ['Balance', balance]
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Transactions sheet (if detailed format and has transactions)
    if (format === 'detailed' && transactions.length > 0) {
      const transactionData = [
        ['Date', 'Category', 'Type', 'Amount', 'Description']
      ];

      transactions.forEach(tx => {
        transactionData.push([
          new Date(tx.date).toLocaleDateString('th-TH'),
          tx.category_name,
          tx.type.toUpperCase(),
          tx.amount,
          tx.description || ''
        ]);
      });

      const transactionsWs = XLSX.utils.aoa_to_sheet(transactionData);
      transactionsWs['!cols'] = [
        { wch: 12 },
        { wch: 20 },
        { wch: 10 },
        { wch: 12 },
        { wch: 30 }
      ];
      XLSX.utils.book_append_sheet(wb, transactionsWs, 'Transactions');
    }

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set response headers
    c.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    c.header('Content-Disposition', `attachment; filename="report-${month}.xlsx"`);

    return c.body(buffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    return c.json({ error: error.message }, 500);
  }
};
