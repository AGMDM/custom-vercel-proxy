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
  uid: string
  email?: string
  name?: string
  iat?: number
  exp?: number
  aud?: string
  iss?: string
  sub?: string
}

// Simple JWT decoder for Firebase ID tokens (for Edge Runtime)
// This only decodes and validates basic structure, not cryptographic verification
function decodeFirebaseToken(token: string): FirebaseTokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }

    // Decode the payload (middle part)
    const payload = parts[1]
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - (payload.length % 4)) % 4)
    const decodedPayload = atob(paddedPayload.replace(/-/g, '+').replace(/_/g, '/'))
    
    const tokenData = JSON.parse(decodedPayload) as FirebaseTokenPayload

    // Basic validation
    if (!tokenData.uid || !tokenData.exp) {
      return null
    }

    // Check if token is expired
    if (Date.now() >= tokenData.exp * 1000) {
      return null
    }

    return tokenData
  } catch (error) {
    console.error('Error decoding Firebase token:', error)
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
