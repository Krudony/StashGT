import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { validateAuthRegistration, validateAuthLogin } from '../utils/validation.js';

const DEFAULT_CATEGORIES = [
  { name: 'ทำบุญ', type: 'income' },
  { name: 'เบี้ยประจำวัน', type: 'income' },
  { name: 'อื่น ๆ (รายรับ)', type: 'income' },
  { name: 'ค่าใช้สอย', type: 'expense' },
  { name: 'ค่าซ่อมแซม', type: 'expense' },
  { name: 'ค่าอาหาร', type: 'expense' },
  { name: 'ค่าพระ', type: 'expense' },
  { name: 'อื่น ๆ (รายจ่าย)', type: 'expense' }
];

export const register = async (c) => {
  try {
    const { username, email, password, temple_name } = await c.req.json();

    // Validate input
    const validationErrors = validateAuthRegistration(username, email, password, temple_name);
    if (validationErrors) {
      return c.json(
        { error: 'Validation error', details: validationErrors },
        400
      );
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (existingUser) {
      return c.json(
        {
          error: 'Validation error',
          details: { email_or_username: 'Username or email already exists' }
        },
        400
      );
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insert user
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert([{
        username,
        email,
        password: hashedPassword,
        temple_name
      }])
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    const userId = newUser.id;

    // Create default categories for this user
    const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
      user_id: userId,
      name: cat.name,
      type: cat.type,
      is_default: true
    }));

    const { error: catError } = await supabase
      .from('categories')
      .insert(categoriesToInsert);

    if (catError) {
      console.error('Error creating categories:', catError);
      // Don't fail registration if categories fail
    }

    return c.json({
      message: 'User registered successfully',
      user: {
        id: userId,
        username: newUser.username,
        email: newUser.email,
        temple_name: newUser.temple_name
      }
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const login = async (c) => {
  try {
    const body = await c.req.json();
    const { username, email, password } = body;

    // Accept either username or email for login
    const identifier = username || email;

    // Validate input
    const validationErrors = validateAuthLogin(identifier || '', password);
    if (validationErrors) {
      return c.json(
        { error: 'Validation error', details: validationErrors },
        400
      );
    }

    // Find user
    let query = supabase
      .from('users')
      .select('id, username, email, temple_name, password');

    if (email) {
      query = query.eq('email', email);
    } else {
      query = query.eq('username', username);
    }

    const { data: users } = await query;

    if (!users || users.length === 0) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = users[0];

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);

    if (!isPasswordValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        temple_name: user.temple_name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const logout = (c) => {
  // Token-based logout (client-side removes token)
  return c.json({ message: 'Logged out successfully' });
};
