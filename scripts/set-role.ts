/**
 * Set Firebase Custom Claims role for a user.
 *
 * Usage:
 *   npx tsx scripts/set-role.ts <email> <role>
 *
 * Examples:
 *   npx tsx scripts/set-role.ts heitorsm@gmail.com admin
 *   npx tsx scripts/set-role.ts user@suno.com.br creator
 *
 * Requires:
 *   - firebase-admin installed (npm install -D firebase-admin)
 *   - GOOGLE_APPLICATION_CREDENTIALS env var or ADC configured
 *   - Or run after `firebase login` (uses ADC)
 */

import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const VALID_ROLES = ['admin', 'creator'] as const;
type Role = (typeof VALID_ROLES)[number];

const [, , email, role] = process.argv;

if (!email || !role) {
  console.error('Usage: npx tsx scripts/set-role.ts <email> <role>');
  console.error('Roles: admin, creator');
  process.exit(1);
}

if (!VALID_ROLES.includes(role as Role)) {
  console.error(`Invalid role: ${role}. Must be one of: ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

const app = initializeApp({
  credential: applicationDefault(),
  projectId: 'koro-creators',
});

const auth = getAuth(app);

async function setRole() {
  try {
    const user = await auth.getUserByEmail(email);
    await auth.setCustomUserClaims(user.uid, { role });
    console.log(`✓ Set role '${role}' for ${email} (uid: ${user.uid})`);
    console.log('  Note: user must re-login or wait for token refresh (~1h) to see the change.');
  } catch (err: unknown) {
    const error = err as Error;
    if (error.message?.includes('no user record')) {
      console.error(`✗ User not found: ${email}`);
    } else {
      console.error(`✗ Error: ${error.message}`);
    }
    process.exit(1);
  }
}

setRole();
