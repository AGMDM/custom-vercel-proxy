import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { verifyKajabiUser } from '@/lib/kajabi'

export async function POST(request: NextRequest) {
  try {
    const { idToken, email, name } = await request.json()

    if (!idToken || !email) {
      return NextResponse.json(
        { error: 'ID token and email are required' },
        { status: 400 }
      )
    }

    // Verify the Firebase ID token
    console.log('Attempting to verify Firebase token...')
    const decodedToken = await verifyFirebaseToken(idToken)
    
    console.log('Firebase token verification result:', decodedToken ? 'Success' : 'Failed')
    
    if (!decodedToken) {
      console.error('Firebase token verification failed - token may be invalid or Firebase Admin not properly configured')
      return NextResponse.json(
        { error: 'Invalid Firebase token or authentication service unavailable' },
        { status: 401 }
      )
    }

    console.log('Decoded token email:', decodedToken.email)

    // Verify the email matches the token
    if (decodedToken.email !== email) {
      console.error('Email mismatch:', { tokenEmail: decodedToken.email, requestEmail: email })
      return NextResponse.json(
        { error: 'Email mismatch' },
        { status: 400 }
      )
    }

    // Verify user exists and is active in Kajabi
    console.log('Verifying user in Kajabi:', email)
    const isKajabiUser = await verifyKajabiUser(email)
    
    if (!isKajabiUser) {
      return NextResponse.json(
        { error: 'User not found in Kajabi or account is inactive' },
        { status: 403 }
      )
    }

    // Create session cookie
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: name || decodedToken.name,
        }
      },
      { status: 200 }
    )

    // Set HTTP-only cookie with Firebase ID token
    response.cookies.set('firebase-token', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response

  } catch (error) {
    console.error('Firebase login verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
