import { NextRequest, NextResponse } from 'next/server'
import { verifyFirebaseToken } from '@/lib/firebase-admin'
import { verifyKajabiUser } from '@/lib/kajabi'

export async function POST(request: NextRequest) {
  try {
    const { idToken, name, email } = await request.json()

    if (!idToken || !name || !email) {
      return NextResponse.json(
        { error: 'ID token, name, and email are required' },
        { status: 400 }
      )
    }

    // Verify the Firebase ID token
    const decodedToken = await verifyFirebaseToken(idToken)
    
    if (!decodedToken) {
      return NextResponse.json(
        { error: 'Invalid Firebase token' },
        { status: 401 }
      )
    }

    // Verify the email matches the token
    if (decodedToken.email !== email) {
      return NextResponse.json(
        { error: 'Email mismatch' },
        { status: 400 }
      )
    }

    // Double-check Kajabi authorization (security measure)
    console.log('Final Kajabi verification for:', email)
    const isKajabiUser = await verifyKajabiUser(email)
    
    if (!isKajabiUser) {
      return NextResponse.json(
        { error: 'User not authorized in Kajabi' },
        { status: 403 }
      )
    }

    // Create a session cookie with the Firebase ID token
    const response = NextResponse.json(
      { 
        message: 'Registration successful',
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: name,
        }
      },
      { status: 201 }
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
    console.error('Firebase registration verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
