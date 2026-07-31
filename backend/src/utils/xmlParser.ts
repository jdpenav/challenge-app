import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { XmlParseError, type ErrorContext, toError } from './errors';

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
});

export function parseXml<T>(xml: string, context: ErrorContext = {}): T {
  if (xml.trim() === '') {
    throw new XmlParseError('Cannot parse an empty XML payload', { context });
  }

  const validation = XMLValidator.validate(xml);
  if (validation !== true) {
    throw new XmlParseError(`Malformed XML: ${validation.err.msg}`, {
      context: { ...context, line: validation.err.line, column: validation.err.col },
    });
  }

  try {
    return parser.parse(xml) as T;
  } catch (error) {
    throw new XmlParseError('Failed to parse XML payload', { cause: toError(error), context });
  }
}

export function toArray<T>(value: T | T[] | '' | null | undefined): T[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
