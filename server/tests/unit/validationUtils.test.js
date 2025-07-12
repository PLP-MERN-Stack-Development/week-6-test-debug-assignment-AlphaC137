// Unit tests for validation utility functions

const {
  validateEmail,
  validatePassword,
  sanitizeInput,
  formatDate,
  truncateText,
  isValidObjectId,
} = require('../../src/utils/validation');

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'firstname.lastname@subdomain.example.com',
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user..name@example.com',
        'user name@example.com',
        '',
        null,
        undefined,
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });
  });

  describe('validatePassword', () => {
    it('should return true for valid passwords', () => {
      const validPasswords = [
        'password123',
        'StrongP@ssw0rd',
        '123456789',
        'test-password',
      ];

      validPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true);
      });
    });

    it('should return false for invalid passwords', () => {
      const invalidPasswords = [
        '12345', // too short
        '', // empty
        null,
        undefined,
      ];

      invalidPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false);
      });
    });

    it('should validate password strength requirements', () => {
      const options = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      };

      expect(validatePassword('StrongP@ss1', options)).toBe(true);
      expect(validatePassword('weakpass', options)).toBe(false);
      expect(validatePassword('UPPERCASE123!', options)).toBe(false); // no lowercase
      expect(validatePassword('lowercase123!', options)).toBe(false); // no uppercase
      expect(validatePassword('NoNumbers!', options)).toBe(false); // no numbers
      expect(validatePassword('NoSpecial123', options)).toBe(false); // no special chars
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML tags and scripts', () => {
      const maliciousInput = '<script>alert("xss")</script><b>Bold text</b>';
      const sanitized = sanitizeInput(maliciousInput);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('</script>');
      expect(sanitized).toBe('Bold text');
    });

    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    it('should preserve safe content', () => {
      const safeInput = 'This is safe text with numbers 123 and symbols @#$';
      expect(sanitizeInput(safeInput)).toBe(safeInput);
    });
  });

  describe('formatDate', () => {
    it('should format dates correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      
      expect(formatDate(date)).toBe('2024-01-15');
      expect(formatDate(date, 'yyyy-MM-dd HH:mm')).toBe('2024-01-15 10:30');
      expect(formatDate(date, 'MMM dd, yyyy')).toBe('Jan 15, 2024');
    });

    it('should handle invalid dates', () => {
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
      expect(formatDate('invalid-date')).toBe('');
    });

    it('should use default format when no format specified', () => {
      const date = new Date('2024-12-25');
      expect(formatDate(date)).toBe('2024-12-25');
    });
  });

  describe('truncateText', () => {
    it('should truncate text to specified length', () => {
      const longText = 'This is a very long text that should be truncated';
      
      expect(truncateText(longText, 20)).toBe('This is a very long...');
      expect(truncateText(longText, 10)).toBe('This is a...');
    });

    it('should not truncate text shorter than max length', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe(shortText);
    });

    it('should handle edge cases', () => {
      expect(truncateText('', 10)).toBe('');
      expect(truncateText(null, 10)).toBe('');
      expect(truncateText(undefined, 10)).toBe('');
      expect(truncateText('test', 0)).toBe('...');
    });

    it('should use custom suffix', () => {
      const text = 'This is a long text';
      expect(truncateText(text, 10, ' [...]')).toBe('This is a [...]');
    });
  });

  describe('isValidObjectId', () => {
    it('should validate MongoDB ObjectIds', () => {
      const validIds = [
        '507f1f77bcf86cd799439011',
        '507f191e810c19729de860ea',
        '65f123456789abcdef123456',
      ];

      validIds.forEach(id => {
        expect(isValidObjectId(id)).toBe(true);
      });
    });

    it('should reject invalid ObjectIds', () => {
      const invalidIds = [
        'invalid-id',
        '123',
        '',
        null,
        undefined,
        '507f1f77bcf86cd799439011x', // too long
        '507f1f77bcf86cd79943901', // too short
      ];

      invalidIds.forEach(id => {
        expect(isValidObjectId(id)).toBe(false);
      });
    });
  });
});

describe('Error Scenarios', () => {
  it('should handle function errors gracefully', () => {
    // Test that functions don't throw errors with unexpected inputs
    expect(() => validateEmail(123)).not.toThrow();
    expect(() => validatePassword({})).not.toThrow();
    expect(() => sanitizeInput([])).not.toThrow();
    expect(() => formatDate('not-a-date')).not.toThrow();
    expect(() => truncateText(123, 10)).not.toThrow();
    expect(() => isValidObjectId({})).not.toThrow();
  });
});
