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
    const auth = await initializeFirebaseAdmin()
    if (!auth) {
      console.error('Firebase Admin not initialized')
      return null
    }

    const decodedToken = await auth.verifyIdToken(idToken)
    return decodedToken
  } catch (error) {
    console.error('Error verifying Firebase token:', error)
    return null
  }
}
