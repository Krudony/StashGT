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
    console.log('=== REGISTRATION REQUEST ===');
    const { username, email, password, temple_name } = await c.req.json();
    console.log('Registration data:', { username, email, temple_name, password: '***' });

    // Validate input
    const validationErrors = validateAuthRegistration(username, email, password, temple_name);
    if (validationErrors) {
      console.log('Validation errors:', validationErrors);
      return c.json(
        { error: 'Validation error', details: validationErrors },
        400
      );
    }

    // Check if user exists
    console.log('Checking if user already exists...');
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${username},email.eq.${email}`)
      .single();

    if (checkError) {
      console.log('Check error (expected if no user exists):', checkError.code);
    }

    if (existingUser) {
      console.log('User already exists');
      return c.json(
        {
          error: 'Validation error',
          details: { email_or_username: 'Username or email already exists' }
        },
        400
      );
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcryptjs.hash(password, 10);
    console.log('Password hashed');

    // Insert user
    console.log('Inserting user into Supabase...');
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
      console.error('User insert error:', userError);
      throw userError;
    }

    console.log('User inserted successfully:', newUser.id);
    const userId = newUser.id;

    // Create default categories for this user
    console.log('Creating default categories...');
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
    } else {
      console.log('Categories created successfully');
    }

    console.log('=== REGISTRATION SUCCESSFUL ===');
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
    console.error('=== REGISTRATION ERROR ===');
    console.error('Error object:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    return c.json({ error: error.message }, 500);
  }
};

export const login = async (c) => {
  try {
    console.log('=== LOGIN REQUEST ===');
    const body = await c.req.json();
    console.log('Request body:', { username: body.username, email: body.email, password: '***' });
    const { username, email, password } = body;

    // Accept either username or email for login
    const identifier = username || email;
    console.log('Identifier:', identifier);

    // Validate input
    const validationErrors = validateAuthLogin(identifier || '', password);
    if (validationErrors) {
      console.log('Validation errors:', validationErrors);
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
      console.log('Querying by email:', email);
      query = query.eq('email', email);
    } else {
      console.log('Querying by username:', username);
      query = query.eq('username', username);
    }

    const { data: users, error: queryError } = await query;
    console.log('Query result - Users found:', users?.length || 0);
    if (queryError) {
      console.error('Supabase query error:', queryError);
      return c.json({ error: 'Database error', details: queryError.message }, 500);
    }

    if (!users || users.length === 0) {
      console.log('No user found with identifier:', identifier);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = users[0];
    console.log('User found:', user.username);
    console.log('Comparing passwords...');

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      console.log('Password mismatch for user:', user.username);
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Generate token
    console.log('Generating token with JWT_SECRET:', process.env.JWT_SECRET ? 'EXISTS' : 'MISSING');
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    console.log('Token generated successfully');

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
    console.error('=== LOGIN ERROR ===');
    console.error('Error object:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    const errorMsg = error?.message || (typeof error === 'string' ? error : 'Login failed');
    return c.json({ error: errorMsg || 'Login failed', detail: String(error) }, 500);
  }
};

export const logout = (c) => {
  // Token-based logout (client-side removes token)
  return c.json({ message: 'Logged out successfully' });
};
