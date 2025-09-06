// Edge Runtime compatible Firebase token verification
// This file should NOT import firebase-admin as it needs to work in Edge Runtime

// SECURITY NOTE:
// This Edge Runtime implementation does basic token validation (structure, expiration)
// but not full cryptographic verification. For production use:
// 1. Middleware does basic validation for performance
// 2. API routes do full verification with Firebase Admin SDK
// 3. Sensitive operations should always re-verify tokens in API routes
// 4. Consider implementing token caching/blacklisting for enhanced security

interface FirebaseTokenPayload {
  uid?: string
  sub?: string  // Firebase uses 'sub' for user ID
  email?: string
  name?: string
  iat?: number
  exp?: number
  aud?: string
  iss?: string
}

// Simple JWT decoder for Firebase ID tokens (for Edge Runtime)
// This only decodes and validates basic structure, not cryptographic verification
function decodeFirebaseToken(token: string): FirebaseTokenPayload | null {
  try {
    console.log('Edge: Decoding Firebase token...')
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('Edge: Invalid token structure - not 3 parts')
      return null
    }

    // Decode the payload (middle part)
    let payload = parts[1]
    
    // Add padding if needed for base64 decoding
    while (payload.length % 4) {
      payload += '='
    }
    
    // Replace URL-safe characters
    payload = payload.replace(/-/g, '+').replace(/_/g, '/')
    
    console.log('Edge: Attempting to decode payload...')
    const decodedPayload = atob(payload)
    console.log('Edge: Payload decoded, parsing JSON...')
    
    const tokenData = JSON.parse(decodedPayload) as FirebaseTokenPayload

    console.log('Edge: Parsed token data:', {
      uid: tokenData.sub || tokenData.uid,
      email: tokenData.email,
      exp: tokenData.exp,
      currentTime: Math.floor(Date.now() / 1000)
    })

    // Firebase tokens use 'sub' field for uid
    const uid = tokenData.sub || tokenData.uid
    
    // Basic validation
    if (!uid || !tokenData.exp) {
      console.log('Edge: Missing required fields (uid or exp)')
      return null
    }

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000)
    if (currentTime >= tokenData.exp) {
      console.log('Edge: Token expired')
      return null
    }

    console.log('Edge: Token validation successful')
    
    return {
      uid: uid,
      email: tokenData.email,
      name: tokenData.name,
      exp: tokenData.exp,
      iat: tokenData.iat,
      aud: tokenData.aud,
      iss: tokenData.iss,
      sub: tokenData.sub
    }
  } catch (error) {
    console.error('Edge: Error decoding Firebase token:', error)
    return null
  }
}

export async function verifyFirebaseTokenEdge(token: string): Promise<FirebaseTokenPayload | null> {
  // For Edge Runtime, we'll do basic token validation
  // The actual cryptographic verification will be done by API routes
  const decoded = decodeFirebaseToken(token)
  
  if (!decoded) {
    return null
  }

  // Additional validation can be added here
  // For production, you might want to cache verified tokens
  
  return decoded
}

export type { FirebaseTokenPayload }
