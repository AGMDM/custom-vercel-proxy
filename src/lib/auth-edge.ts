// Edge Runtime compatible JWT utilities
// Uses Web APIs instead of Node.js crypto module

export interface UserPayload {
  userId: string
  email: string
  name?: string
  iat?: number
  exp?: number
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

// Base64URL encoding/decoding utilities
function base64UrlEscape(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64UrlUnescape(str: string): string {
  str += new Array(5 - (str.length % 4)).join('=')
  return str.replace(/\-/g, '+').replace(/_/g, '/')
}

function base64UrlDecode(str: string): string {
  return atob(base64UrlUnescape(str))
}

function base64UrlEncode(str: string): string {
  return base64UrlEscape(btoa(str))
}

// Convert string to ArrayBuffer
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

// Convert ArrayBuffer to hex string
function arrayBufferToHex(buffer: ArrayBuffer): string {
  const byteArray = new Uint8Array(buffer)
  const hexCodes = Array.from(byteArray).map(value => {
    const hexCode = value.toString(16)
    const paddedHexCode = hexCode.padStart(2, '0')
    return paddedHexCode
  })
  return hexCodes.join('')
}

// HMAC SHA-256 signature using Web Crypto API
async function sign(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    stringToArrayBuffer(message)
  )
  
  const signatureArray = new Uint8Array(signature)
  return base64UrlEncode(String.fromCharCode(...Array.from(signatureArray)))
}

// Verify HMAC SHA-256 signature
async function verify(message: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await sign(message, secret)
  return expectedSignature === signature
}

export async function verifyJWT(token: string): Promise<UserPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    const [headerB64, payloadB64, signatureB64] = parts
    
    // Verify signature
    const message = `${headerB64}.${payloadB64}`
    const isValid = await verify(message, signatureB64, JWT_SECRET)
    
    if (!isValid) {
      return null
    }

    // Decode payload
    const payloadJson = base64UrlDecode(payloadB64)
    const payload = JSON.parse(payloadJson) as UserPayload

    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return null
    }

    return payload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export async function signJWT(payload: Omit<UserPayload, 'iat' | 'exp'>): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const now = Math.floor(Date.now() / 1000)
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + (7 * 24 * 60 * 60) // 7 days
  }

  const headerB64 = base64UrlEncode(JSON.stringify(header))
  const payloadB64 = base64UrlEncode(JSON.stringify(fullPayload))
  
  const message = `${headerB64}.${payloadB64}`
  const signature = await sign(message, JWT_SECRET)
  
  return `${message}.${signature}`
}
