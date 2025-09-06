import { NextRequest, NextResponse } from 'next/server'
import { hashPassword } from '@/lib/auth'
import { verifyEmailInKajabi } from '@/lib/kajabi'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// In production, this would be a database
// For demo purposes, we'll append to a JSON file
const USERS_FILE = join(process.cwd(), 'data', 'users.json')

interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: string
}

function loadUsers(): User[] {
  try {
    const data = readFileSync(USERS_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return empty array
    return []
  }
}

function saveUsers(users: User[]): void {
  try {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data')
    const fs = require('fs')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }
    
    writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Failed to save users:', error)
    throw new Error('Failed to save user data')
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      )
    }

    // Load existing users
    const users = loadUsers()

    // Check if user already exists locally (Firebase equivalent)
    const existingUser = users.find(user => user.email === email)
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account already exists' },
        { status: 409 }
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

    // Hash the password
    const passwordHash = await hashPassword(password)

    // Create new user
    const newUser: User = {
      id: generateUserId(),
      email,
      name,
      passwordHash,
      createdAt: new Date().toISOString(),
    }

    // Add user to array and save
    users.push(newUser)
    saveUsers(users)

    return NextResponse.json(
      { 
        message: 'User registered successfully',
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          createdAt: newUser.createdAt,
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateUserId(): string {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}
