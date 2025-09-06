import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { signJWT } from '@/lib/auth-edge'
import { verifyKajabiUser, verifyEmailInKajabi } from '@/lib/kajabi'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // First, authenticate the user with our local authentication
    const user = await authenticateUser(email, password)
    
    if (!user) {
      // Check if email exists in Kajabi but not locally
      console.log('Checking if email exists in Kajabi:', email)
      const emailExistsInKajabi = await verifyEmailInKajabi(email)
      
      if (emailExistsInKajabi) {
        return NextResponse.json(
          { error: 'Account found in Kajabi but not registered locally. Please use the registration form to create a local account.' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Then verify the user exists in Kajabi and is active
    console.log('Verifying user in Kajabi:', email)
    const isKajabiUser = await verifyKajabiUser(email)
    
    if (!isKajabiUser) {
      return NextResponse.json(
        { error: 'User not found in Kajabi or account is inactive' },
        { status: 403 }
      )
    }

    // Generate JWT token
    const token = await signJWT({
      userId: user.userId,
      email: user.email,
      name: user.name,
    })

    // Create response with cookie
    const response = NextResponse.json(
      { 
        message: 'Login successful',
        user: {
          id: user.userId,
          email: user.email,
          name: user.name,
        }
      },
      { status: 200 }
    )

    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
