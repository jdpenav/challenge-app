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

type AttemptResult =
  { ok: true; body: string } | { ok: false; error: ExternalApiError; retryable: boolean };

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number): number {
  return Math.min(RETRY_BASE_DELAY_MS * 2 ** (attempt - 1), RETRY_MAX_DELAY_MS);
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
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
      ...result.error.context,
    });

    if (!result.retryable || attempt >= totalAttempts) {
      throw result.error;
    }

    await delay(backoffDelay(attempt));
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
