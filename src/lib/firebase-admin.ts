import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

// Initialize Firebase Admin
function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    // For development, we'll use the Firebase project ID from client config
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    
    if (!projectId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is required')
    }

    // In development, you can use the emulator or application default credentials
    // For production, you'd use a service account key
    try {
      const app = initializeApp({
        projectId: projectId,
        // If you have a service account key file, you can use:
        // credential: cert(require('./path/to/serviceAccountKey.json'))
      })
      
      return app
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error)
      throw error
    }
  }
  
  return getApps()[0]
}

// Initialize the app
let adminApp: any = null
try {
  adminApp = initializeFirebaseAdmin()
} catch (error) {
  console.error('Firebase Admin initialization failed:', error)
}

// Export the auth instance
export const adminAuth = adminApp ? getAuth(adminApp) : null

// Helper function to verify Firebase ID tokens
export async function verifyFirebaseToken(idToken: string) {
  if (!adminAuth) {
    console.error('Firebase Admin not initialized')
    return null
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    return decodedToken
  } catch (error) {
    console.error('Error verifying Firebase token:', error)
    return null
  }
}

export { adminApp }
