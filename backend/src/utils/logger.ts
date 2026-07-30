import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, errors, json, colorize, printf, splat } = winston.format;

const structuredFormat = combine(timestamp(), errors({ stack: true }), splat(), json());

const readableFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss.SSS' }),
  splat(),
  printf(({ level, message, timestamp: time, service: _service, ...meta }) => {
    const extra = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `${String(time)} ${level} ${String(message)}${extra}`;
  }),
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: config.env === 'development' ? readableFormat : structuredFormat,
  defaultMeta: { service: 'vehicle-makes-service' },
  transports: [new winston.transports.Console()],
  silent: config.env === 'test',
});
