import { supabase } from '../config/supabase.js';
import { validateCreateCategory, validators } from '../utils/validation.js';

export const getCategories = async (c) => {
  try {
    const userId = c.get('userId');

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, type, is_default, created_at')
      .eq('user_id', userId)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    return c.json(data);
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
    const validationErrors = validateCreateCategory(name, type);
    if (validationErrors) {
      return c.json(
        { error: 'Validation error', details: validationErrors },
        400
      );
    }

    // Check if category already exists
    const { data: existingCategory, error: checkError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .eq('type', type)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" which is what we want
      throw checkError;
    }

    if (existingCategory) {
      return c.json(
        { error: 'Validation error', details: { name: 'Category already exists for this type' } },
        400
      );
    }

    // Insert new category
    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: userId,
        name,
        type,
        is_default: false
      })
      .select('id, name, type, is_default, created_at')
      .single();

    if (error) {
      throw error;
    }

    return c.json(data, 201);
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

    // Validate name
    if (!validators.validateCategoryName(name)) {
      return c.json(
        { error: 'Validation error', details: { name: 'Category name is required (1-100 characters)' } },
        400
      );
    }

    // Verify category belongs to user and check if default
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('id, is_default, type')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !category) {
      return c.json(
        { error: 'Validation error', details: { id: 'Category not found' } },
        404
      );
    }

    // Cannot edit default categories
    if (category.is_default) {
      return c.json(
        { error: 'Validation error', details: { name: 'Cannot edit default categories' } },
        400
      );
    }

    // Update category
    const { data, error } = await supabase
      .from('categories')
      .update({
        name,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('id, name, type, is_default, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return c.json(data);
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
    const { data: category, error: fetchError } = await supabase
      .from('categories')
      .select('id, is_default')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Cannot delete default categories
    if (category.is_default) {
      return c.json({ error: 'Cannot delete default categories' }, 400);
    }

    // Check if category has transactions
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id);

    if (countError) {
      throw countError;
    }

    if (count > 0) {
      return c.json({ error: 'Cannot delete category with transactions' }, 400);
    }

    // Delete category
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      throw deleteError;
    }

    return c.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    return c.json({ error: error.message }, 500);
  }
};
