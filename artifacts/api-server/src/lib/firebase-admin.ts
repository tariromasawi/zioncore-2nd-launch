import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from 'firebase-admin/app';

export const ZIONCORE_2ND_FIREBASE_PROJECT_ID = 'zioncore-2nd-production';
const adminAppName = 'zioncore-2nd-api';
let configuredServiceAccountEmail: string | null = null;

export class FirebaseAdminConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FirebaseAdminConfigurationError';
  }
}

export type FirebaseAdminCredentialMode = 'service-account-json' | 'cloud-run-adc';

export function resolveFirebaseAdminCredentialMode(
  env: NodeJS.ProcessEnv = process.env,
): FirebaseAdminCredentialMode {
  const requestedMode = env.ZIONCORE_2ND_ADMIN_AUTH_MODE;
  if (requestedMode === 'adc') {
    if (env.K_SERVICE !== adminAppName) {
      throw new FirebaseAdminConfigurationError(
        'ADC mode is permitted only in the ZionCore 2nd Cloud Run service.',
      );
    }
    return 'cloud-run-adc';
  }
  if (requestedMode && requestedMode !== 'service-account-json') {
    throw new FirebaseAdminConfigurationError(
      'ZIONCORE_2ND_ADMIN_AUTH_MODE must be adc or service-account-json.',
    );
  }
  if (!env.ZIONCORE_2ND_BOOTSTRAP_SERVICE_ACCOUNT_JSON) {
    throw new FirebaseAdminConfigurationError(
      'ZIONCORE_2ND_BOOTSTRAP_SERVICE_ACCOUNT_JSON is not configured.',
    );
  }
  return 'service-account-json';
}

function readServiceAccount(): ServiceAccount {
  const raw = process.env.ZIONCORE_2ND_BOOTSTRAP_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new FirebaseAdminConfigurationError(
      'ZIONCORE_2ND_BOOTSTRAP_SERVICE_ACCOUNT_JSON is not configured.',
    );
  }

  let parsed: {
    projectId?: string;
    project_id?: string;
    clientEmail?: string;
    client_email?: string;
    privateKey?: string;
    private_key?: string;
  };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new FirebaseAdminConfigurationError(
      'ZIONCORE_2ND_BOOTSTRAP_SERVICE_ACCOUNT_JSON is not valid JSON.',
    );
  }

  const projectId = parsed.projectId ?? parsed.project_id;
  const clientEmail = parsed.clientEmail ?? parsed.client_email;
  const privateKey = parsed.privateKey ?? parsed.private_key;
  if (projectId !== ZIONCORE_2ND_FIREBASE_PROJECT_ID) {
    throw new FirebaseAdminConfigurationError(
      'The Firebase Admin credential does not match the approved Firebase project.',
    );
  }
  if (!clientEmail || !privateKey) {
    throw new FirebaseAdminConfigurationError(
      'The Firebase Admin credential is missing required service-account fields.',
    );
  }
  configuredServiceAccountEmail = clientEmail;
  return { projectId, clientEmail, privateKey };
}

export function getFirebaseAdminCredentialEmail(): string | null {
  return configuredServiceAccountEmail;
}

export function getFirebaseAdminApp(): App {
  const existing = getApps().find(app => app.name === adminAppName);
  if (existing) {
    if (existing.options.projectId !== ZIONCORE_2ND_FIREBASE_PROJECT_ID) {
      throw new FirebaseAdminConfigurationError(
        'The initialized Firebase Admin app uses an unexpected project.',
      );
    }
    return existing;
  }

  const mode = resolveFirebaseAdminCredentialMode();
  const credential = mode === 'cloud-run-adc'
    ? applicationDefault()
    : cert(readServiceAccount());
  return initializeApp(
    {
      credential,
      projectId: ZIONCORE_2ND_FIREBASE_PROJECT_ID,
    },
    adminAppName,
  );
}
