import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

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
    if (!username || !email || !password || !temple_name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return c.json({ error: 'Username or email already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Insert user
    const userResult = await pool.query(
      'INSERT INTO users (username, email, password, temple_name) VALUES ($1, $2, $3, $4) RETURNING id, username, temple_name, email',
      [username, email, hashedPassword, temple_name]
    );

    const user = userResult.rows[0];

    // Create default categories for this user
    for (const cat of DEFAULT_CATEGORIES) {
      await pool.query(
        'INSERT INTO categories (user_id, name, type, is_default) VALUES ($1, $2, $3, $4)',
        [user.id, cat.name, cat.type, true]
      );
    }

    return c.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        temple_name: user.temple_name
      }
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return c.json({ error: error.message }, 500);
  }
};

export const login = async (c) => {
  try {
    const { username, password } = await c.req.json();

    // Validate input
    if (!username || !password) {
      return c.json({ error: 'Username and password are required' }, 400);
    }

    // Find user
    const result = await pool.query(
      'SELECT id, username, email, temple_name, password FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    const user = result.rows[0];

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
