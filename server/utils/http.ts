export interface CookieSerializeOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'lax' | 'strict' | 'none' | boolean
  path?: string
  maxAge?: number
  expires?: Date
  domain?: string
}

export function getRequestHeaderSafe(event: any, name: string): string | undefined {
  if (!event || !name) return undefined
  const lowerName = name.toLowerCase()

  // 1. Check if event.node.req.headers (Node.js IncomingMessage)
  const nodeHeaders = event?.node?.req?.headers || event?.req?.headers
  if (nodeHeaders && typeof nodeHeaders === 'object' && typeof nodeHeaders.get !== 'function') {
    const val = nodeHeaders[lowerName]
    if (Array.isArray(val)) return val.join(', ')
    if (typeof val === 'string') return val
    return val !== undefined ? String(val) : undefined
  }

  // 2. Web API Headers instance (.get() method)
  if (typeof event?.req?.headers?.get === 'function') {
    try {
      return event.req.headers.get(lowerName) ?? undefined
    } catch {}
  }
  if (typeof event?.headers?.get === 'function') {
    try {
      return event.headers.get(lowerName) ?? undefined
    } catch {}
  }

  return undefined
}

export function getCookieSafe(event: any, name: string): string | undefined {
  const cookieHeader = getRequestHeaderSafe(event, 'cookie')
  if (!cookieHeader) return undefined
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match && match[1] !== undefined ? decodeURIComponent(match[1]) : undefined
}

export function serializeCookie(name: string, val: string, opt: CookieSerializeOptions = {}): string {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(val)}`
  if (opt.maxAge !== undefined) {
    cookie += `; Max-Age=${opt.maxAge}`
  }
  if (opt.domain) {
    cookie += `; Domain=${opt.domain}`
  }
  if (opt.path) {
    cookie += `; Path=${opt.path}`
  } else {
    cookie += '; Path=/'
  }
  if (opt.expires) {
    cookie += `; Expires=${opt.expires.toUTCString()}`
  }
  if (opt.httpOnly) {
    cookie += '; HttpOnly'
  }
  if (opt.secure) {
    cookie += '; Secure'
  }
  if (opt.sameSite) {
    const sameSite = typeof opt.sameSite === 'string' ? opt.sameSite.toLowerCase() : 'lax'
    cookie += `; SameSite=${sameSite === 'none' ? 'None' : sameSite === 'strict' ? 'Strict' : 'Lax'}`
  }
  return cookie
}

export function setCookieSafe(event: any, name: string, value: string, options: CookieSerializeOptions = {}) {
  const serialized = serializeCookie(name, value, options)

  // Node.js ServerResponse
  const res = event?.node?.res || event?.res
  if (res && typeof res.setHeader === 'function') {
    const prev = typeof res.getHeader === 'function' ? res.getHeader('set-cookie') : undefined
    if (!prev) {
      res.setHeader('Set-Cookie', serialized)
    } else if (Array.isArray(prev)) {
      res.setHeader('Set-Cookie', [...prev, serialized])
    } else {
      res.setHeader('Set-Cookie', [String(prev), serialized])
    }
    return
  }

  // Web API Response headers
  if (typeof event?.res?.headers?.append === 'function') {
    try {
      event.res.headers.append('set-cookie', serialized)
    } catch {}
  }
}

export function deleteCookieSafe(event: any, name: string, options: CookieSerializeOptions = {}) {
  setCookieSafe(event, name, '', {
    ...options,
    maxAge: 0,
    expires: new Date(0)
  })
}

export async function readBodySafe<T = any>(event: any): Promise<T | undefined> {
  if (!event) return undefined

  // 1. If already parsed and cached
  if (event._body !== undefined) return event._body
  if (event.body !== undefined) return event.body
  if (event.node?.req?.body !== undefined) return event.node.req.body

  // 2. If Web API Request object (event.req.json() or event.req.text())
  if (typeof event?.req?.json === 'function') {
    try {
      const parsed = await event.req.json()
      event._body = parsed
      return parsed
    } catch {}
  }
  if (typeof event?.req?.text === 'function') {
    try {
      const text = await event.req.text()
      if (!text) return undefined
      const parsed = JSON.parse(text)
      event._body = parsed
      return parsed
    } catch {}
  }

  // 3. Node.js IncomingMessage stream (event.node?.req or event.req)
  const req = event.node?.req || event.req
  if (req && typeof req.on === 'function') {
    return new Promise<T | undefined>((resolve, reject) => {
      let data = ''
      req.on('data', (chunk: any) => {
        data += chunk
      })
      req.on('end', () => {
        if (!data) {
          event._body = undefined
          return resolve(undefined)
        }
        try {
          const parsed = JSON.parse(data)
          event._body = parsed
          resolve(parsed)
        } catch {
          event._body = data
          resolve(data as any)
        }
      })
      req.on('error', (err: any) => {
        reject(err)
      })
    })
  }

  return undefined
}

