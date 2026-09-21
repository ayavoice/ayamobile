import Constants from "expo-constants";
import type {
  AppLanguage,
  AuthResult,
  AyaaiSpeechRequest,
  AyaaiSpeechResponse,
  AyaaiTranscriptRequest,
  AyaaiTranscriptResponse,
  CreateTransactionBody,
  HealthResponse,
  ParsedIntent,
  RequestOtpBody,
  TransactionListResponse,
  TransactionResponse,
  VerifyOtpBody,
  WalletResponse,
} from "@aya/shared";

const API_PORT = 4000;

/**
 * Resolve the ayaserver base URL.
 * Priority: EXPO_PUBLIC_API_URL env override > Expo dev server host (your PC on
 * the same Wi-Fi) > Android emulator loopback.
 */
export function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(":")[0] : "10.0.2.2";
  return `http://${host}:${API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

const DEFAULT_TIMEOUT_MS = 20_000;

/**
 * Turn a failed network/Api error into copy a user can read. Raw statuses,
 * URLs and Kotlin payloads never reach the UI — the caller still sees the real
 * error via console.warn when it logs `err` itself.
 */
export function friendlyApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return "No connection. Check your internet and try again.";
    if (err.status === 401) return "Your session expired. Please sign in again.";
    if (err.status === 429) return "Too many requests. Wait a moment and try again.";
    if (err.status >= 500) return "Aya's service is having trouble right now. Please try again.";
  }
  return fallback;
}

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  let res: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      res = await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(`Request timed out: ${url}`, 0, "timeout");
    }
    throw new ApiError(`No network: ${url}`, 0, err);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => undefined);
    throw new ApiError(`HTTP ${res.status} ${path}`, res.status, text);
  }
  return (await res.json()) as T;
}

function bytesToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...Array.from(bytes.subarray(i, i + CHUNK)));
  }
  return btoa(binary);
}

/** Data URI ready for expo-audio playback (e.g. `data:audio/wav;base64,...`). */
export function audioDataUri(response: AyaaiSpeechResponse): string {
  return `data:${response.mimeType};base64,${response.audio}`;
}

/** Response for POST /v1/auth/request-otp (devCode present outside production). */
export type OtpRequestResponse = {
  message: string;
  expiresInSeconds: number;
  devCode: string | null;
};

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export const api = {
  baseUrl: API_BASE_URL,

  health: () => requestJson<HealthResponse>("/health"),

  /** Real OTP authentication against ayaserver (no PINs anywhere server-side). */
  auth: {
    /** Requests a 6-digit OTP. `devCode` is returned in dev/test only. */
    async requestOtp(phone: string): Promise<OtpRequestResponse> {
      const body: RequestOtpBody = { phone };
      return requestJson<OtpRequestResponse>("/v1/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },

    /** Exchanges the 6-digit code for a JWT session. */
    async verifyOtp(phone: string, code: string): Promise<AuthResult> {
      const body: VerifyOtpBody = { phone, code };
      return requestJson<AuthResult>("/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
  },

  /** Authorized ledger access — wallet read + an ACTIVITY LOG ONLY. The
   *  server ledger is never treated as the money truth for a balance. */
  transactions: {
    bearer(token: string) {
      return {
        wallet: () =>
          requestJson<WalletResponse>("/v1/wallet", { headers: authHeaders(token) }),
        list: () =>
          requestJson<TransactionListResponse>("/v1/transactions", {
            headers: authHeaders(token),
          }),
        create: (body: CreateTransactionBody) =>
          requestJson<TransactionResponse>("/v1/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders(token) },
            body: JSON.stringify(body),
          }),
      };
    },
  },

  /** Voice endpoints proxy through ayaserver to ayaai (Phase 2 wiring). */
  voice: {
    transcribe(request: {
      audio: ArrayBuffer;
      sampleRate: number;
      language: AppLanguage;
    }): Promise<AyaaiTranscriptResponse> {
      const body: AyaaiTranscriptRequest = {
        audio: bytesToBase64(request.audio),
        sampleRate: request.sampleRate,
        language: request.language,
      };
      return requestJson<AyaaiTranscriptResponse>("/v1/voice/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, 120_000);
    },

    speak(request: AyaaiSpeechRequest): Promise<AyaaiSpeechResponse> {
      return requestJson<AyaaiSpeechResponse>("/v1/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }, 120_000);
    },

    /** Transcribe + parse intent in one round-trip (Phase 2 NLU). */
    interpret(request: {
      audio: ArrayBuffer;
      sampleRate: number;
      language: AppLanguage;
    }): Promise<ParsedIntent> {
      const body: AyaaiTranscriptRequest = {
        audio: bytesToBase64(request.audio),
        sampleRate: request.sampleRate,
        language: request.language,
      };
      return requestJson<ParsedIntent>("/v1/voice/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, 120_000);
    },
  },
};