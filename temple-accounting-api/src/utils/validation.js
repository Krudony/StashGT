// Authentication validation
export const validateAuthRegistration = (username, email, password, temple_name) => {
  const errors = {};

  if (!username || username.trim().length < 3) {
    errors.username = 'Username must be at least 3 characters long';
  }

  if (!email || !isValidEmail(email)) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password || password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  if (!temple_name || temple_name.trim().length === 0) {
    errors.temple_name = 'Temple name is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

export const validateAuthLogin = (identifier, password) => {
  const errors = {};

  if (!identifier || identifier.trim().length === 0) {
    errors.identifier = 'Email or username is required';
  }

  if (!password || password.length === 0) {
    errors.password = 'Password is required';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Category validation
export const validateCreateCategory = (name, type) => {
  const errors = {};

  if (!name || name.trim().length === 0) {
    errors.name = 'Category name is required';
  }

  if (!type || !['income', 'expense'].includes(type)) {
    errors.type = 'Type must be either "income" or "expense"';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Transaction validation
export const validateCreateTransaction = (type, category_id, amount, date, description) => {
  const errors = {};

  if (!type || !['income', 'expense'].includes(type)) {
    errors.type = 'Type must be either "income" or "expense"';
  }

  if (!category_id) {
    errors.category_id = 'Category is required';
  }

  if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
    errors.amount = 'Amount must be a positive number';
  }

  if (!date || !isValidDate(date)) {
    errors.date = 'Please provide a valid date (YYYY-MM-DD format)';
  }

  if (description && typeof description !== 'string') {
    errors.description = 'Description must be a string';
  }

  return Object.keys(errors).length > 0 ? errors : null;
};

// Utility validators object for backward compatibility
export const validators = {
  validateCategoryName: (name) => {
    return name && typeof name === 'string' && name.trim().length > 0;
  },

  validateCategoryType: (type) => {
    return ['income', 'expense'].includes(type);
  },

  validateAmount: (amount) => {
    return !isNaN(amount) && parseFloat(amount) > 0;
  },

  validateDate: (date) => {
    return isValidDate(date);
  }
};

// Helper functions
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidDate(dateString) {
  // Check if it's a valid date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString + 'T00:00:00Z');
  return date instanceof Date && !isNaN(date);
}
