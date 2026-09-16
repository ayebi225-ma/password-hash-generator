export interface HashResult {
  hash: string;
  algorithm: string;
  executionTimeMs: number;
  parameters: Record<string, any>;
}

export interface VerifyDetailedResult {
  valid: boolean;
  algorithm: string;
  executionTimeMs: number;
}

export interface Argon2Options {
  algorithm?: 'argon2id' | 'argon2i' | 'argon2d';
  memoryCost?: number;
  timeCost?: number;
  parallelism?: number;
  outputLen?: number;
}

export interface BcryptOptions {
  cost?: number;
  prefix?: '2b' | '2y';
}

export interface ScryptOptions {
  cost?: number;
  blockSize?: number;
  parallelization?: number;
  keyLen?: number;
  saltLen?: number;
}

export type HashOptions = Argon2Options & BcryptOptions & ScryptOptions & {
  algorithm?: 'argon2id' | 'argon2i' | 'argon2d' | 'bcrypt' | 'scrypt';
};

export interface GeneratePasswordOptions {
  length?: number;
  uppercase?: boolean;
  lowercase?: boolean;
  numbers?: boolean;
  symbols?: boolean;
  avoidAmbiguous?: boolean;
}

export interface GeneratePassphraseOptions {
  words?: number;
  separator?: string;
  capitalize?: boolean;
  includeNumber?: boolean;
}

export interface StrengthAnalysis {
  score: number;
  label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  entropyBits: number;
  length: number;
  crackTimes: {
    onlineThrottled: string;
    onlineUnthrottled: string;
    offlineSlowKdf: string;
    offlineFastHash: string;
  };
  weaknesses: string[];
  recommendation: string;
}

export interface PasswordPolicy {
  minLength?: number;
  maxLength?: number;
  requireUppercase?: boolean;
  requireLowercase?: boolean;
  requireNumbers?: boolean;
  requireSymbols?: boolean;
  minEntropy?: number;
  disallowWhitespace?: boolean;
  forbiddenWords?: string[];
}

export interface PolicyValidationResult {
  compliant: boolean;
  violations: string[];
  details: Record<string, any>;
}

export interface SecretOptions {
  bytes?: number;
  format?: 'hex' | 'base64' | 'base64url' | 'uuid';
}

export function hash(secret: string | Buffer, options?: HashOptions): Promise<HashResult>;
export function hashArgon2(secret: string | Buffer, options?: Argon2Options): Promise<HashResult>;
export function hashBcrypt(secret: string | Buffer, options?: BcryptOptions): Promise<HashResult>;
export function hashScrypt(secret: string | Buffer, options?: ScryptOptions): Promise<HashResult>;

export function verify(secret: string | Buffer, hashString: string): Promise<boolean>;
export function verifyDetailed(secret: string | Buffer, hashString: string): Promise<VerifyDetailedResult>;
export function detectHashAlgorithm(hashString: string): string | null;

export function inspectHash(hashString: string): Record<string, any>;
export function detectAlgorithm(input: string): Record<string, any>;

export function generatePassword(options?: GeneratePasswordOptions): string;
export function generatePassphrase(options?: GeneratePassphraseOptions): string;

export function calculateEntropy(secretInput: string): number;
export function formatDuration(seconds: number): string;
export function analyzeStrength(secretInput: string): StrengthAnalysis;

export function validatePolicy(secretInput: string, policy?: PasswordPolicy): PolicyValidationResult;

export function generateSecret(options?: SecretOptions): string;

export function runBenchmark(options?: { rounds?: number }): Promise<Record<string, any>>;
