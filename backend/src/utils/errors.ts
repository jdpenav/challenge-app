export type ErrorContext = Record<string, unknown>;

export interface AppErrorOptions extends ErrorOptions {
  context?: ErrorContext;
}

export class AppError extends Error {
  readonly context: ErrorContext;

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, options);
    this.name = new.target.name;
    this.context = options.context ?? {};
  }
}

export class ExternalApiError extends AppError {}

export class XmlParseError extends AppError {}

export class TransformationError extends AppError {}

export class PersistenceError extends AppError {}

export function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}
