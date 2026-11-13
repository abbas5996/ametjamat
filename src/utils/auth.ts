import { UserProfile } from '../types';
import { appendActivityLog } from './rbac';

export const JANAB_USERNAME = 'janabadmin';
export const JANAB_DISPLAY_NAME = 'Janab Amil Saheb';
export const JANAB_ROLE = 'Super Admin';
export const JANAB_ITS_NUMBER = '30491024';

export const AUTH_SESSION_KEY = 'jamat_auth_session';
export const AUTH_USER_KEY = 'jamat_user';
export const JANAB_PWD_STORAGE_KEY = 'janab_root_pwd';
const INITIAL_JANAB_PWD = 'jamat#5253';

export interface AuthResult {
  ok: boolean;
  user?: UserProfile;
  error?: string;
}

export interface PasswordResetResult {
  ok: boolean;
  error?: string;
  message?: string;
}

/**
 * Checks whether a given profile represents the authenticated Janab account.
 */
export const isJanabUser = (user?: UserProfile | null): boolean => {
  if (!user) return false;
  return (
    user.username.toLowerCase() === JANAB_USERNAME &&
    user.role === JANAB_ROLE
  );
};

/**
 * Returns the active Janab password stored in localStorage (or initial default until changed).
 */
export const getJanabStoredPassword = (): string => {
  try {
    return localStorage.getItem(JANAB_PWD_STORAGE_KEY) || INITIAL_JANAB_PWD;
  } catch {
    return INITIAL_JANAB_PWD;
  }
};

/**
 * Strict Janab-only login validation. Rejects all general user logins & sign-up attempts.
 */
export const authenticateJanab = (rawUsername: string, password: string): AuthResult => {
  const normalizedUser = rawUsername.trim().toLowerCase();

  if (!normalizedUser || !password) {
    return {
      ok: false,
      error: 'Please enter both username and password.',
    };
  }

  // Strictly restrict authentication to Janab ONLY (accepts 'janabadmin' or 'janab')
  if (normalizedUser !== JANAB_USERNAME && normalizedUser !== 'janab') {
    return {
      ok: false,
      error:
        'Access is restricted exclusively to Janab (janabadmin). General user login and public sign-up are disabled.',
    };
  }

  const activePassword = getJanabStoredPassword();
  if (password !== activePassword) {
    return {
      ok: false,
      error: 'Invalid Janab password. Please verify your credentials.',
    };
  }

  const profile: UserProfile = {
    username: JANAB_USERNAME,
    displayName: JANAB_DISPLAY_NAME,
    role: JANAB_ROLE,
    itsNumber: JANAB_ITS_NUMBER,
    permissions: 'all',
  };

  return { ok: true, user: profile };
};

/**
 * Loads the persisted authenticated Janab session, clearing invalid or legacy sessions.
 */
export const restoreJanabSession = (): UserProfile | null => {
  try {
    const isAuth = localStorage.getItem(AUTH_SESSION_KEY) === 'true';
    const rawUser = localStorage.getItem(AUTH_USER_KEY);
    if (!isAuth || !rawUser) return null;

    const parsed = JSON.parse(rawUser) as UserProfile;
    if (!isJanabUser(parsed)) {
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
      return null;
    }
    return { ...parsed, permissions: 'all' };
  } catch {
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

export const persistJanabSession = (profile: UserProfile): void => {
  try {
    localStorage.setItem(AUTH_SESSION_KEY, 'true');
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to persist session:', err);
  }
};

export const clearJanabSession = (): void => {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.error('Failed to clear session:', err);
  }
};

/**
 * Strict Janab-exclusive password update. Requires valid Janab session and exact current password.
 */
export const resetJanabPassword = (params: {
  currentUser: UserProfile;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): PasswordResetResult => {
  const { currentUser, currentPassword, newPassword, confirmPassword } = params;

  if (!isJanabUser(currentUser)) {
    return {
      ok: false,
      error: 'Unauthorized: Password reset is restricted exclusively to Janab.',
    };
  }

  const activePassword = getJanabStoredPassword();
  if (!currentPassword) {
    return { ok: false, error: 'Current password is required.' };
  }
  if (currentPassword !== activePassword) {
    return { ok: false, error: 'Current password is incorrect.' };
  }

  if (!newPassword.trim()) {
    return { ok: false, error: 'New password cannot be empty.' };
  }
  if (newPassword.length < 6) {
    return { ok: false, error: 'New password must be at least 6 characters.' };
  }
  if (newPassword === activePassword) {
    return { ok: false, error: 'New password must be different from your current password.' };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, error: 'New password and confirmation do not match.' };
  }

  try {
    localStorage.setItem(JANAB_PWD_STORAGE_KEY, newPassword);
  } catch {
    return { ok: false, error: 'Unable to persist updated password in browser storage.' };
  }

  appendActivityLog(
    currentUser.username,
    'System Settings',
    'Janab Password Reset',
    'ADMIN_RESET_PASSWORD',
    'Janab updated portal credentials successfully.'
  );

  return {
    ok: true,
    message:
      'Janab password updated successfully. Your new password is active immediately for subsequent logins.',
  };
};
