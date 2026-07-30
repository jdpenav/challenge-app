import 'dotenv/config';
import Joi from 'joi';

export type Environment = 'development' | 'test' | 'production';

export interface AppConfig {
  env: Environment;
  isProduction: boolean;
  server: {
    port: number;
  };
  logging: {
    level: string;
  };
  vpic: {
    baseUrl: string;
    timeoutMs: number;
    maxRetries: number;
  };
  dynamo: {
    endpoint: string | undefined;
    region: string;
    tableName: string;
    credentials: {
      accessKeyId: string;
      secretAccessKey: string;
    };
  };
  ingestion: {
    concurrency: number;
    maxMakes: number;
    runOnStartup: boolean;
  };
}

interface RawEnv {
  NODE_ENV: Environment;
  PORT: number;
  LOG_LEVEL: string;
  VPIC_BASE_URL: string;
  VPIC_TIMEOUT_MS: number;
  VPIC_MAX_RETRIES: number;
  DYNAMODB_ENDPOINT: string;
  DYNAMODB_REGION: string;
  DYNAMODB_TABLE_NAME: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  INGESTION_CONCURRENCY: number;
  INGESTION_MAX_MAKES: number;
  INGEST_ON_STARTUP: boolean;
}

const envSchema = Joi.object<RawEnv, true>({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  VPIC_BASE_URL: Joi.string().uri().default('https://vpic.nhtsa.dot.gov/api/vehicles'),
  VPIC_TIMEOUT_MS: Joi.number().integer().min(1000).default(15000),
  VPIC_MAX_RETRIES: Joi.number().integer().min(0).max(10).default(3),

  DYNAMODB_ENDPOINT: Joi.string().uri().allow('').default('http://localhost:8000'),
  DYNAMODB_REGION: Joi.string().default('us-east-1'),
  DYNAMODB_TABLE_NAME: Joi.string().default('vehicle_makes'),
  AWS_ACCESS_KEY_ID: Joi.string().default('local'),
  AWS_SECRET_ACCESS_KEY: Joi.string().default('local'),

  INGESTION_CONCURRENCY: Joi.number().integer().min(1).max(50).default(10),
  INGESTION_MAX_MAKES: Joi.number().integer().min(0).default(500),
  INGEST_ON_STARTUP: Joi.boolean().default(false),
}).unknown(true);

export class ConfigValidationError extends Error {
  constructor(details: string[]) {
    super(`Invalid environment configuration:\n${details.map((d) => `  - ${d}`).join('\n')}`);
    this.name = 'ConfigValidationError';
  }
}

export function loadConfig(source: NodeJS.ProcessEnv = process.env): AppConfig {
  const { value, error } = envSchema.validate(source, { abortEarly: false, convert: true });

  if (error) {
    throw new ConfigValidationError(error.details.map((detail) => detail.message));
  }

  return {
    env: value.NODE_ENV,
    isProduction: value.NODE_ENV === 'production',
    server: {
      port: value.PORT,
    },
    logging: {
      level: value.LOG_LEVEL,
    },
    vpic: {
      baseUrl: value.VPIC_BASE_URL.replace(/\/+$/, ''),
      timeoutMs: value.VPIC_TIMEOUT_MS,
      maxRetries: value.VPIC_MAX_RETRIES,
    },
    dynamo: {
      endpoint: value.DYNAMODB_ENDPOINT === '' ? undefined : value.DYNAMODB_ENDPOINT,
      region: value.DYNAMODB_REGION,
      tableName: value.DYNAMODB_TABLE_NAME,
      credentials: {
        accessKeyId: value.AWS_ACCESS_KEY_ID,
        secretAccessKey: value.AWS_SECRET_ACCESS_KEY,
      },
    },
    ingestion: {
      concurrency: value.INGESTION_CONCURRENCY,
      maxMakes: value.INGESTION_MAX_MAKES,
      runOnStartup: value.INGEST_ON_STARTUP,
    },
  };
}

function loadOrExit(): AppConfig {
  try {
    return loadConfig();
  } catch (error) {
    process.stderr.write(`${(error as Error).message}\n`);
    return process.exit(1);
  }
}

export const config = loadOrExit();
