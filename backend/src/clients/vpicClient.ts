import { config } from '../config';
import type {
  VpicAllMakesResponse,
  VpicMakeEntry,
  VpicVehicleTypeEntry,
  VpicVehicleTypesResponse,
} from '../models/vpic';
import { ExternalApiError, toError, type ErrorContext } from '../utils/errors';
import { logger } from '../utils/logger';
import { parseXml, toArray } from '../utils/xmlParser';

const RETRY_BASE_DELAY_MS = 300;
const RETRY_MAX_DELAY_MS = 5_000;
const RETRY_JITTER_RATIO = 0.3;

// vPIC enforces a request quota per time window and answers 403 once it is exceeded,
// rather than the conventional 429. Recovering needs a pause long enough for the window
// to roll over, so throttling gets its own, much slower backoff.
const THROTTLING_STATUSES = [403, 429];
const THROTTLE_BASE_DELAY_MS = 3_000;
const THROTTLE_MAX_DELAY_MS = 30_000;

type AttemptFailure = {
  ok: false;
  error: ExternalApiError;
  retryable: boolean;
  throttled: boolean;
};

type AttemptResult = { ok: true; body: string } | AttemptFailure;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number, throttled: boolean): number {
  const base = throttled ? THROTTLE_BASE_DELAY_MS : RETRY_BASE_DELAY_MS;
  const ceiling = throttled ? THROTTLE_MAX_DELAY_MS : RETRY_MAX_DELAY_MS;
  const wait = Math.min(base * 2 ** (attempt - 1), ceiling);

  return wait + Math.random() * wait * RETRY_JITTER_RATIO;
}

function isThrottled(status: number): boolean {
  return THROTTLING_STATUSES.includes(status);
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || isThrottled(status) || status >= 500;
}

function unwrapResults<T extends object>(results: T | '' | undefined): T | undefined {
  return results === undefined || results === '' ? undefined : results;
}

async function attemptRequest(url: string, context: ErrorContext): Promise<AttemptResult> {
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/xml' },
      signal: AbortSignal.timeout(config.vpic.timeoutMs),
    });

    if (!response.ok) {
      return {
        ok: false,
        retryable: isRetryableStatus(response.status),
        throttled: isThrottled(response.status),
        error: new ExternalApiError(`vPIC responded with status ${response.status}`, {
          context: { ...context, url, status: response.status },
        }),
      };
    }

    return { ok: true, body: await response.text() };
  } catch (error) {
    return {
      ok: false,
      retryable: true,
      throttled: false,
      error: new ExternalApiError('vPIC request could not be completed', {
        cause: toError(error),
        context: { ...context, url },
      }),
    };
  }
}

async function requestXml(path: string, context: ErrorContext): Promise<string> {
  const url = `${config.vpic.baseUrl}${path}`;
  const totalAttempts = config.vpic.maxRetries + 1;

  for (let attempt = 1; ; attempt += 1) {
    const result = await attemptRequest(url, context);

    if (result.ok) {
      return result.body;
    }

    const cause = toError(result.error.cause ?? result.error);
    logger.warn(result.error.message, {
      errorMessage: cause.message,
      errorName: cause.name,
      attempt,
      totalAttempts,
      throttled: result.throttled,
      ...result.error.context,
    });

    if (!result.retryable || attempt >= totalAttempts) {
      throw result.error;
    }

    await delay(backoffDelay(attempt, result.throttled));
  }
}

export async function fetchAllMakes(): Promise<VpicMakeEntry[]> {
  const context: ErrorContext = { operation: 'fetchAllMakes' };
  const xml = await requestXml('/getallmakes?format=XML', context);
  const parsed = parseXml<VpicAllMakesResponse>(xml, context);

  return toArray(unwrapResults(parsed.Response?.Results)?.AllVehicleMakes);
}

export async function fetchVehicleTypesByMakeId(makeId: string): Promise<VpicVehicleTypeEntry[]> {
  const context: ErrorContext = { operation: 'fetchVehicleTypesByMakeId', makeId };
  const path = `/GetVehicleTypesForMakeId/${encodeURIComponent(makeId)}?format=xml`;
  const xml = await requestXml(path, context);
  const parsed = parseXml<VpicVehicleTypesResponse>(xml, context);

  return toArray(unwrapResults(parsed.Response?.Results)?.VehicleTypesForMakeIds);
}
