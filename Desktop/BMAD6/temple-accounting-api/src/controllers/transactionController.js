import { supabase } from '../config/supabase.js';
import { validateCreateTransaction } from '../utils/validation.js';

export const getTransactions = async (c) => {
  try {
    const userId = c.get('userId');
    const month = c.req.query('month');
    const categoryId = c.req.query('category');
    const type = c.req.query('type');

    // Build the query
    let query = supabase
      .from('transactions')
      .select(`
        id, user_id, category_id, type, amount, date,
        description, details, created_at, updated_at,
        categories!inner(name)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters if provided
    if (month) {
      // For PostgreSQL, we need to extract year-month from date
      // Format: YYYY-MM
      const startDate = `${month}-01`;
      const [year, monthNum] = month.split('-');
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${month}-${lastDay}`;

      query = query.gte('date', startDate).lte('date', endDate);
    }

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform the response to match the original format
    const transactions = data.map(t => ({
      id: t.id,
      user_id: t.user_id,
      category_id: t.category_id,
      type: t.type,
      amount: t.amount,
      date: t.date,
      description: t.description,
      details: t.details,
      created_at: t.created_at,
      updated_at: t.updated_at,
      category_name: t.categories.name
    }));

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
    const validationErrors = validateCreateTransaction(type, category_id, amount, date, description);
    if (validationErrors) {
      return c.json(
        { error: 'Validation error', details: validationErrors },
        400
      );
    }

    // Verify category belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .eq('user_id', userId)
      .single();

    if (categoryError || !category) {
      return c.json(
        { error: 'Validation error', details: { category_id: 'Category not found' } },
        404
      );
    }

    // Create transaction
    const transactionData = {
      user_id: userId,
      category_id,
      type,
      amount: parseFloat(amount),
      date,
      description: description || null,
      details: details || null
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return c.json(data, 201);
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
    const validationErrors = validateCreateTransaction(type, category_id, amount, date, description);
    if (validationErrors) {
      return c.json(
        { error: 'Validation error', details: validationErrors },
        400
      );
    }

    // Verify transaction belongs to user
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (transactionError || !transaction) {
      return c.json(
        { error: 'Validation error', details: { id: 'Transaction not found' } },
        404
      );
    }

    // Verify category belongs to user
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', category_id)
      .eq('user_id', userId)
      .single();

    if (categoryError || !category) {
      return c.json(
        { error: 'Validation error', details: { category_id: 'Category not found' } },
        404
      );
    }

    // Update transaction
    const updateData = {
      type,
      category_id,
      amount: parseFloat(amount),
      date,
      description: description || null,
      details: details || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('transactions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return c.json(data);
  } catch (error) {
    console.error('Update transaction error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const deleteTransaction = async (c) => {
  try {
    const userId = c.get('userId');
    const id = c.req.param('id');

    const { data, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return c.json({ error: 'Transaction not found' }, 404);
    }

    return c.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return c.json({ error: error.message }, 500);
  }
};
