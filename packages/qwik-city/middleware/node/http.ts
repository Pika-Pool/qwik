import type { IncomingMessage, ServerResponse } from 'node:http';
import type { QwikCityMode } from '../../runtime/src/types';
import type { ResponseStreamWriter, ServerRequestEvent } from '../request-handler/types';

export function getUrl(req: IncomingMessage) {
  const protocol =
    (req.socket as any).encrypted || (req.connection as any).encrypted ? 'https' : 'http';
  return new URL(req.url || '/', `${protocol}://${req.headers.host}`);
}

export async function fromNodeHttp(
  url: URL,
  req: IncomingMessage,
  res: ServerResponse,
  mode: QwikCityMode
) {
  const { Request, Headers } = await import('undici');

  const requestHeaders = new Headers();
  const nodeRequestHeaders = req.headers;
  for (const key in nodeRequestHeaders) {
    const value = nodeRequestHeaders[key];
    if (typeof value === 'string') {
      requestHeaders.set(key, value);
    } else if (Array.isArray(value)) {
      for (const v of value) {
        requestHeaders.append(key, v);
      }
    }
  }

  const getRequestBody = async function* () {
    for await (const chunk of req as any) {
      yield chunk;
    }
  };

  const body = req.method === 'HEAD' || req.method === 'GET' ? undefined : getRequestBody();
  const serverRequestEv: ServerRequestEvent<boolean> = {
    mode,
    url,
    request: new Request(url.href, {
      method: req.method,
      headers: requestHeaders,
      body,
      duplex: 'half',
    }) as any,
    getWritableStream: (status, headers, cookies) => {
      res.statusCode = status;
      headers.forEach((value, key) => res.setHeader(key, value));
      const cookieHeaders = cookies.headers();
      if (cookieHeaders.length > 0) {
        res.setHeader('Set-Cookie', cookieHeaders);
      }
      const stream: ResponseStreamWriter = {
        write: (chunk) => res.write(chunk),
        close: () => res.end(),
      };
      return stream;
    },
    platform: {
      ssr: true,
      node: process.versions.node,
    },
    locale: undefined,
  };

  return serverRequestEv;
}
