import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getToken,
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  type AppCheck,
} from 'firebase/app-check';
import {
  browserPopupRedirectResolver,
  browserLocalPersistence,
  getAuth,
  initializeAuth,
  type Auth,
  type User,
} from 'firebase/auth';
import { getFirebaseAppIdentityMismatch } from '@/lib/firebase-app-identity';

export const APPROVED_FIREBASE_PROJECT_ID = 'zioncore-2nd-production';

const env = import.meta.env ?? ({} as ImportMetaEnv);
const firebaseConfig = {
  apiKey: env.VITE_ZIONCORE_2ND_FIREBASE_API_KEY,
  authDomain: env.VITE_ZIONCORE_2ND_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_ZIONCORE_2ND_FIREBASE_PROJECT_ID,
  appId: env.VITE_ZIONCORE_2ND_FIREBASE_APP_ID,
  messagingSenderId: env.VITE_ZIONCORE_2ND_FIREBASE_MESSAGING_SENDER_ID || undefined,
  storageBucket: env.VITE_ZIONCORE_2ND_FIREBASE_STORAGE_BUCKET || undefined,
};

const appCheckSiteKey = env.VITE_ZIONCORE_2ND_FIREBASE_APPCHECK_SITE_KEY;
const developmentAppCheckDebugToken =
  (env as Record<string, string | undefined>)
    .VITE_ZIONCORE_2ND_FIREBASE_APPCHECK_DEBUG_TOKEN;
const isDedicatedDevelopmentApp =
  env.DEV === true &&
  firebaseConfig.appId === '1:225578874852:web:e9e67e76109a011219b9f1';
const firebaseAuthServerConfigured =
  env.VITE_ZIONCORE_2ND_FIREBASE_AUTH_SERVER_CONFIGURED === 'true';
export const firebaseGoogleAuthConfigured =
  env.VITE_ZIONCORE_2ND_FIREBASE_GOOGLE_AUTH_CONFIGURED === 'true';
export const firebaseAppleAuthConfigured =
  env.VITE_ZIONCORE_2ND_FIREBASE_APPLE_AUTH_CONFIGURED === 'true';
const firestoreClientAccessApproved =
  env.VITE_ZIONCORE_2ND_FIRESTORE_CLIENT_ACCESS_APPROVED === 'true';
// This operator acknowledgement is not a substitute for a valid App Check token.
// It only records that Firebase AI Auth mode, App Check, and project quotas were
// reviewed. Research AI remains disabled until a cost-quoted backend route exists.
export const firebaseAiProjectSecurityConfirmed =
  env.VITE_ZIONCORE_2ND_FIREBASE_AI_PROJECT_SECURITY_CONFIRMED === 'true';
const configMissing = [
  ['VITE_ZIONCORE_2ND_FIREBASE_API_KEY', firebaseConfig.apiKey],
  ['VITE_ZIONCORE_2ND_FIREBASE_AUTH_DOMAIN', firebaseConfig.authDomain],
  ['VITE_ZIONCORE_2ND_FIREBASE_PROJECT_ID', firebaseConfig.projectId],
  ['VITE_ZIONCORE_2ND_FIREBASE_APP_ID', firebaseConfig.appId],
].filter(([, value]) => !value).map(([name]) => name);

export let firebaseProjectMismatch =
  Boolean(firebaseConfig.projectId) &&
  firebaseConfig.projectId !== APPROVED_FIREBASE_PROJECT_ID;
export let firebaseAppIdMismatch = false;

export let firebaseApp: FirebaseApp | null = null;
export let firebaseAuth: Auth | null = null;
export let firebaseAppCheck: AppCheck | null = null;
export let firebaseInitError = '';

if (!firebaseProjectMismatch && configMissing.length === 0) {
  try {
    const appName = 'zioncore-2nd-frequency-lab';
    const existing = getApps().find(candidate => candidate.name === appName);
    const identityMismatch = getFirebaseAppIdentityMismatch(
      existing?.options,
      { projectId: APPROVED_FIREBASE_PROJECT_ID, appId: firebaseConfig.appId },
    );
    if (identityMismatch === 'project') {
      firebaseProjectMismatch = true;
    } else if (identityMismatch === 'app-id') {
      firebaseAppIdMismatch = true;
    } else {
      // Do not reuse the main app's default Firebase instance: App Check
      // attestation is bound to the registered web App ID as well as project.
      firebaseApp = existing ?? initializeApp(firebaseConfig, appName);

      if (getFirebaseAppIdentityMismatch(
        firebaseApp.options,
        { projectId: APPROVED_FIREBASE_PROJECT_ID, appId: firebaseConfig.appId },
      ) === 'project') {
        firebaseProjectMismatch = true;
        firebaseApp = null;
      } else if (getFirebaseAppIdentityMismatch(
        firebaseApp.options,
        { projectId: APPROVED_FIREBASE_PROJECT_ID, appId: firebaseConfig.appId },
      ) === 'app-id') {
        firebaseAppIdMismatch = true;
        firebaseApp = null;
      } else {
        try {
          firebaseAuth = initializeAuth(firebaseApp, {
            persistence: browserLocalPersistence,
            popupRedirectResolver: browserPopupRedirectResolver,
          });
        } catch (error) {
          const code = typeof error === 'object' && error && 'code' in error
            ? String(error.code)
            : '';
          if (code !== 'auth/already-initialized') throw error;
          firebaseAuth = getAuth(firebaseApp);
        }
        if (appCheckSiteKey) {
          try {
            if (
              isDedicatedDevelopmentApp &&
              developmentAppCheckDebugToken &&
              typeof self !== 'undefined'
            ) {
              (self as typeof self & {
                FIREBASE_APPCHECK_DEBUG_TOKEN?: string;
              }).FIREBASE_APPCHECK_DEBUG_TOKEN = developmentAppCheckDebugToken;
            }
            firebaseAppCheck = initializeAppCheck(firebaseApp, {
              provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
              isTokenAutoRefreshEnabled: true,
            });
          } catch {
            // App Check is optional; it must not block Firebase Authentication.
            firebaseAppCheck = null;
          }
        }
      }
    }
  } catch {
    firebaseInitError = 'Firebase could not be initialized. Check the web app configuration.';
    firebaseApp = null;
    firebaseAuth = null;
    firebaseAppCheck = null;
  }
}

export const firebaseAuthConfigured = Boolean(
  firebaseAuth && firebaseAuthServerConfigured,
);
export const firebaseCloudReady = Boolean(
  firebaseAuthConfigured && firestoreClientAccessApproved && !firebaseInitError,
);
export const firebaseAiClientConfigured = Boolean(
  firebaseApp && firebaseAuthConfigured && firebaseAppCheck && !firebaseInitError,
);
export const firebaseAiReady = Boolean(
  firebaseAiClientConfigured && firebaseAiProjectSecurityConfirmed,
);

export function getFirebaseSetupMessage() {
  if (firebaseProjectMismatch) {
    return `This lab is locked to Firebase project ${APPROVED_FIREBASE_PROJECT_ID}. The configured project does not match.`;
  }
  if (firebaseAppIdMismatch) {
    return 'The initialized Firebase web App ID does not match this environment. App Check and cloud requests remain paused.';
  }
  if (firebaseInitError) return firebaseInitError;
  if (configMissing.length > 0) {
    return `Firebase is not configured yet. Add ${configMissing.join(', ')} to the web app environment.`;
  }
  if (!firebaseAuthServerConfigured) {
    return 'Firebase Authentication is not marked ready for this app environment. Cloud sign-in and history remain paused until its configuration is verified.';
  }
  if (!firebaseAppCheck) {
    return 'Firebase App Check is not initialized. Cloud history and AI requests remain paused until attestation is configured.';
  }
  if (!firestoreClientAccessApproved) {
    return 'Cloud history is paused until the merged Firestore rules and App Check token exchange are reviewed and verified.';
  }
  return '';
}

export function getFirebaseAiSetupMessage() {
  if (firebaseProjectMismatch) {
    return `This lab is locked to Firebase project ${APPROVED_FIREBASE_PROJECT_ID}. The configured project does not match.`;
  }
  if (firebaseAppIdMismatch) {
    return 'The initialized Firebase web App ID does not match this environment. App Check and cloud AI requests remain paused.';
  }
  if (firebaseInitError) return firebaseInitError;
  if (configMissing.length > 0) {
    return `Firebase is not configured yet. Add ${configMissing.join(', ')} to the web app environment.`;
  }
  if (!firebaseAuthServerConfigured) {
    return 'Firebase Authentication is not marked ready for this app environment. Cloud AI requests remain paused until its configuration is verified.';
  }
  if (!firebaseAppCheck) {
    return 'Firebase App Check is not initialized. Cloud AI requests remain paused.';
  }
  if (!firebaseAiProjectSecurityConfirmed) {
    return 'Cloud AI remains paused until authenticated-users mode, App Check enforcement, and project quota settings are reviewed and confirmed.';
  }
  return '';
}

export async function requireFirebaseAppCheckToken(): Promise<string> {
  if (!firebaseAppCheck) {
    throw new Error('Firebase App Check is not initialized.');
  }
  try {
    const token = await getToken(firebaseAppCheck);
    if (token.token) return token.token;
  } catch {
    // Keep the diagnostic stable and do not expose provider details.
  }
  throw new Error('Firebase App Check could not obtain a valid token. Cloud and AI requests remain paused.');
}

export async function getFirebaseIdentityHeaders(
  user: User,
  options: { requireAppCheck?: boolean } = {},
) {
  const idToken = await user.getIdToken();
  if (!idToken) throw new Error('A Firebase sign-in token could not be obtained.');
  const headers: Record<string, string> = {
    Authorization: `Bearer ${idToken}`,
    Accept: 'application/json',
  };
  if (options.requireAppCheck) {
    headers['x-firebase-appcheck'] = await requireFirebaseAppCheckToken();
  } else if (firebaseAppCheck) {
    try {
      headers['x-firebase-appcheck'] = await requireFirebaseAppCheckToken();
    } catch {
      // App Check is best-effort; verified Firebase Authentication is required.
    }
  }
  return headers;
}
