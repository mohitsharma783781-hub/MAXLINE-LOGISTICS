export interface RegistrationInput {
  name: string;
  businessName: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  data?: T;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateRegistrationInput(input: any): ValidationResult<RegistrationInput> {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Invalid request payload. Request body must be an object.'] };
  }

  const rawName = typeof input.name === 'string' ? input.name.trim() : '';
  const rawBusinessName = typeof input.businessName === 'string' ? input.businessName.trim() : '';
  const rawEmail = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const rawPassword = typeof input.password === 'string' ? input.password : '';

  if (!rawName || rawName.length < 2) {
    errors.push('Full name is required and must be at least 2 characters.');
  } else if (rawName.length > 100) {
    errors.push('Full name must not exceed 100 characters.');
  }

  if (!rawBusinessName || rawBusinessName.length < 2) {
    errors.push('Business or trade name is required and must be at least 2 characters.');
  } else if (rawBusinessName.length > 150) {
    errors.push('Business name must not exceed 150 characters.');
  }

  if (!rawEmail || !EMAIL_REGEX.test(rawEmail) || rawEmail.length > 255) {
    errors.push('A valid business email address is required.');
  }

  if (!rawPassword || rawPassword.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  } else if (rawPassword.length > 72) {
    errors.push('Password exceeds maximum allowed length of 72 characters.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      name: rawName,
      businessName: rawBusinessName,
      email: rawEmail,
      password: rawPassword
    }
  };
}

export function validateLoginInput(input: any): ValidationResult<LoginInput> {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { isValid: false, errors: ['Invalid request payload. Request body must be an object.'] };
  }

  const rawEmail = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const rawPassword = typeof input.password === 'string' ? input.password : '';

  if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
    errors.push('A valid email address is required.');
  }

  if (!rawPassword || rawPassword.length < 1) {
    errors.push('Password is required.');
  } else if (rawPassword.length > 72) {
    errors.push('Password exceeds maximum allowed length.');
  }

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    data: {
      email: rawEmail,
      password: rawPassword
    }
  };
}
