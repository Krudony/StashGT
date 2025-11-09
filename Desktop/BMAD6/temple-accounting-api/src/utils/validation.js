/**
 * Validation utilities for API endpoints
 */

export const validators = {
  // User validation
  validateUsername: (username) => {
    if (!username || typeof username !== 'string') return false;
    return username.length >= 3 && username.length <= 50;
  },

  validateEmail: (email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  validatePassword: (password) => {
    if (!password || typeof password !== 'string') return false;
    // At least 6 characters
    return password.length >= 6;
  },

  validateTempleName: (templeName) => {
    if (!templeName || typeof templeName !== 'string') return false;
    return templeName.length >= 1 && templeName.length <= 100;
  },

  // Transaction validation
  validateAmount: (amount) => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0 && num <= 999999999.99;
  },

  validateType: (type) => {
    return type === 'income' || type === 'expense';
  },

  validateDate: (date) => {
    if (!date || typeof date !== 'string') return false;
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    // Check if it's a valid date
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj);
  },

  validateDescription: (description) => {
    if (!description) return true; // Optional
    return typeof description === 'string' && description.length <= 500;
  },

  validateCategoryId: (categoryId) => {
    const num = parseInt(categoryId);
    return !isNaN(num) && num > 0;
  },

  // Category validation
  validateCategoryName: (name) => {
    if (!name || typeof name !== 'string') return false;
    return name.length >= 1 && name.length <= 100;
  },

  // Month validation
  validateMonth: (month) => {
    if (!month || typeof month !== 'string') return false;
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) return false;
    // Validate month range
    const parts = month.split('-');
    const monthNum = parseInt(parts[1]);
    return monthNum >= 1 && monthNum <= 12;
  }
};

/**
 * Validation error builder
 */
export const validationError = (field, message) => {
  return {
    error: 'Validation error',
    details: { [field]: message }
  };
};

/**
 * Multi-field validation
 */
export const validateAuthRegistration = (username, email, password, templeName) => {
  const errors = {};

  if (!validators.validateUsername(username)) {
    errors.username = 'Username must be 3-50 characters';
  }

  if (!validators.validateEmail(email)) {
    errors.email = 'Invalid email format';
  }

  if (!validators.validatePassword(password)) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (!validators.validateTempleName(templeName)) {
    errors.temple_name = 'Temple name is required (1-100 characters)';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateAuthLogin = (email, password) => {
  const errors = {};

  if (!validators.validateEmail(email)) {
    errors.email = 'Invalid email format';
  }

  if (!password) {
    errors.password = 'Password is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateCreateTransaction = (type, categoryId, amount, date, description) => {
  const errors = {};

  if (!validators.validateType(type)) {
    errors.type = 'Type must be "income" or "expense"';
  }

  if (!validators.validateCategoryId(categoryId)) {
    errors.category_id = 'Invalid category ID';
  }

  if (!validators.validateAmount(amount)) {
    errors.amount = 'Amount must be a positive number';
  }

  if (!validators.validateDate(date)) {
    errors.date = 'Invalid date format (use YYYY-MM-DD)';
  }

  if (!validators.validateDescription(description)) {
    errors.description = 'Description must be 0-500 characters';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateCreateCategory = (name, type) => {
  const errors = {};

  if (!validators.validateCategoryName(name)) {
    errors.name = 'Category name is required (1-100 characters)';
  }

  if (!validators.validateType(type)) {
    errors.type = 'Type must be "income" or "expense"';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};
