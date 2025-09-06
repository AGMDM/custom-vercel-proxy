// Firebase Admin SDK - Only for Node.js runtime (API routes)
// DO NOT import this in middleware or Edge Runtime contexts

let adminAuth: any = null
let isInitialized = false

// Lazy initialization function
async function initializeFirebaseAdmin() {
  if (isInitialized) {
    return adminAuth
  }

  try {
    // Dynamic imports to avoid loading in Edge Runtime
    const { initializeApp, getApps, cert } = await import('firebase-admin/app')
    const { getAuth } = await import('firebase-admin/auth')

    if (getApps().length === 0) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      
      if (!projectId) {
        throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required')
      }

      const app = initializeApp({
        projectId: projectId,
        // For production, add service account credentials here
      })
      
      adminAuth = getAuth(app)
    } else {
      const { getAuth } = await import('firebase-admin/auth')
      adminAuth = getAuth(getApps()[0])
    }
    
    isInitialized = true
    return adminAuth
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error)
    throw error
  }
}

// Helper function to verify Firebase ID tokens (Node.js runtime only)
export async function verifyFirebaseToken(idToken: string) {
  try {
    console.log('Initializing Firebase Admin...')
    const auth = await initializeFirebaseAdmin()
    if (!auth) {
      console.error('Firebase Admin not initialized')
      return null
    }

    console.log('Firebase Admin initialized, verifying token...')
    const decodedToken = await auth.verifyIdToken(idToken)
    console.log('Token verification successful:', { uid: decodedToken.uid, email: decodedToken.email })
    return decodedToken
  } catch (error) {
    console.error('Error verifying Firebase token:', error)
    
    // For development, if Firebase Admin fails, we can do basic validation
    if (process.env.NODE_ENV === 'development') {
      console.log('Development mode: Attempting basic token validation fallback...')
      try {
        // Basic token decoding for development
        const parts = idToken.split('.')
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
          if (payload.exp && Date.now() < payload.exp * 1000) {
            console.log('Development fallback token validation successful:', { uid: payload.sub, email: payload.email })
            return {
              uid: payload.sub,
              email: payload.email,
              name: payload.name,
            }
          }
        }
      } catch (fallbackError) {
        console.error('Development fallback also failed:', fallbackError)
      }
    }
    
    return null
  }
}
