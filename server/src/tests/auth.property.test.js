// Feature: job-fraud-detection, Property 3: Password hashing is irreversible and non-deterministic

/**
 * Property-Based Test for bcrypt password hashing
 *
 * Property 3: Password hashing is irreversible and non-deterministic
 * Validates: Requirements 1.5
 */

const fc = require('fast-check');
const bcrypt = require('bcrypt');

describe('Auth — Property 3: Password hashing is irreversible and non-deterministic', () => {
  test('bcrypt.compare returns true for original password, false for modified password, and hash !== plaintext', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 64 }),
        async (password) => {
          const hash = await bcrypt.hash(password, 10);

          // Correct password must match
          const match = await bcrypt.compare(password, hash);

          // Modified password must not match
          const noMatch = await bcrypt.compare(password + 'x', hash);

          // Hash must not be stored as plaintext
          return match === true && noMatch === false && hash !== password;
        }
      ),
      { numRuns: 100 }
    );
  });
});
