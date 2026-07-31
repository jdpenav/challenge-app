import type { NextFunction, Request, Response } from 'express';
import { errorHandler, notFoundHandler } from '../../middlewares/errorHandler';

function mockResponse(): Response {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

function mockRequest(method = 'GET', url = '/unknown'): Request {
  return { method, originalUrl: url } as Request;
}

describe('notFoundHandler', () => {
  it('answers 404 naming the attempted route', () => {
    const res = mockResponse();

    notFoundHandler(mockRequest('POST', '/missing'), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Not Found',
      message: 'Cannot POST /missing',
    });
  });
});

describe('errorHandler', () => {
  it('answers 500 with a generic payload', () => {
    const res = mockResponse();

    errorHandler(new Error('database exploded'), mockRequest(), res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred while processing the request',
    });
  });

  it('never leaks the original message or stack to the client', () => {
    const res = mockResponse();
    const error = new Error('secret connection string');

    errorHandler(error, mockRequest(), res, jest.fn() as NextFunction);

    const payload = JSON.stringify((res.json as jest.Mock).mock.calls[0]?.[0]);
    expect(payload).not.toContain('secret connection string');
    expect(payload).not.toContain('at ');
  });
});
