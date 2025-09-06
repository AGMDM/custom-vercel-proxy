import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailInKajabi } from '@/lib/kajabi'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Check if email exists in Kajabi - user MUST be in Kajabi to register
    console.log('Checking email authorization in Kajabi:', email)
    const emailExistsInKajabi = await verifyEmailInKajabi(email)
    
    if (!emailExistsInKajabi) {
      return NextResponse.json(
        { error: 'You are not authorized to create an account on this website' },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { message: 'Email is authorized' },
      { status: 200 }
    )

  } catch (error) {
    console.error('Kajabi check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
