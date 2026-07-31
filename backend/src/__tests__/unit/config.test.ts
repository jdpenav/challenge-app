import { ConfigValidationError, loadConfig } from '../../config';

const minimalEnv = {} as NodeJS.ProcessEnv;

describe('loadConfig defaults', () => {
  it('applies sensible defaults when nothing is set', () => {
    const config = loadConfig(minimalEnv);

    expect(config.env).toBe('development');
    expect(config.isProduction).toBe(false);
    expect(config.server.port).toBe(3000);
    expect(config.logging.level).toBe('info');
    expect(config.vpic.baseUrl).toBe('https://vpic.nhtsa.dot.gov/api/vehicles');
    expect(config.dynamo.tableName).toBe('VehicleMakes');
    expect(config.ingestion.concurrency).toBe(10);
    expect(config.ingestion.maxMakes).toBe(200);
    expect(config.ingestion.runOnStartup).toBe(false);
  });

  it('coerces numeric and boolean strings', () => {
    const config = loadConfig({
      PORT: '8080',
      INGESTION_CONCURRENCY: '25',
      INGEST_ON_STARTUP: 'true',
    } as NodeJS.ProcessEnv);

    expect(config.server.port).toBe(8080);
    expect(config.ingestion.concurrency).toBe(25);
    expect(config.ingestion.runOnStartup).toBe(true);
  });

  it('marks production correctly', () => {
    expect(loadConfig({ NODE_ENV: 'production' } as NodeJS.ProcessEnv).isProduction).toBe(true);
  });

  it('strips trailing slashes from the vPIC base url', () => {
    const config = loadConfig({ VPIC_BASE_URL: 'https://example.com/api///' } as NodeJS.ProcessEnv);
    expect(config.vpic.baseUrl).toBe('https://example.com/api');
  });

  it('treats an empty DynamoDB endpoint as undefined so the AWS default chain applies', () => {
    expect(
      loadConfig({ DYNAMODB_ENDPOINT: '' } as NodeJS.ProcessEnv).dynamo.endpoint,
    ).toBeUndefined();
  });

  it('ignores unrelated environment variables', () => {
    expect(() =>
      loadConfig({ SOME_UNRELATED_VARIABLE: 'whatever' } as NodeJS.ProcessEnv),
    ).not.toThrow();
  });
});

describe('loadConfig validation', () => {
  it('rejects an invalid port', () => {
    expect(() => loadConfig({ PORT: '99999' } as NodeJS.ProcessEnv)).toThrow(ConfigValidationError);
  });

  it('rejects an unknown log level', () => {
    expect(() => loadConfig({ LOG_LEVEL: 'verbose' } as NodeJS.ProcessEnv)).toThrow(
      ConfigValidationError,
    );
  });

  it('rejects an unknown environment', () => {
    expect(() => loadConfig({ NODE_ENV: 'staging' } as NodeJS.ProcessEnv)).toThrow(
      ConfigValidationError,
    );
  });

  it('rejects a concurrency below one', () => {
    expect(() => loadConfig({ INGESTION_CONCURRENCY: '0' } as NodeJS.ProcessEnv)).toThrow(
      ConfigValidationError,
    );
  });

  it('rejects a non uri vPIC base url', () => {
    expect(() => loadConfig({ VPIC_BASE_URL: 'not-a-url' } as NodeJS.ProcessEnv)).toThrow(
      ConfigValidationError,
    );
  });

  it('reports every invalid variable at once', () => {
    expect.assertions(3);
    try {
      loadConfig({
        PORT: '99999',
        LOG_LEVEL: 'verbose',
        INGESTION_CONCURRENCY: '0',
      } as NodeJS.ProcessEnv);
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain('PORT');
      expect(message).toContain('LOG_LEVEL');
      expect(message).toContain('INGESTION_CONCURRENCY');
    }
  });
});
