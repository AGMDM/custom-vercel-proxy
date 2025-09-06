import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { join } from 'path'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

export interface UserPayload {
  userId: string
  email: string
  name?: string
  iat?: number
  exp?: number
}

export interface User {
  id: string
  email: string
  name?: string
  passwordHash: string
  createdAt?: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function signJWT(payload: Omit<UserPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d',
  })
}

export function verifyJWT(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

// Mock user database - in production, this would be a real database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@example.com',
    name: 'Admin User',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKcVr/z/HK8sT1K', // password123
  },
  {
    id: '2',
    email: 'user@example.com',
    name: 'Test User',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKcVr/z/HK8sT1K', // password123
  }
]

// Load dynamic users from file
function loadDynamicUsers(): User[] {
  try {
    const usersFile = join(process.cwd(), 'data', 'users.json')
    const data = readFileSync(usersFile, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    // File doesn't exist or is invalid, return empty array
    return []
  }
}

export async function authenticateUser(email: string, password: string): Promise<UserPayload | null> {
  // Combine mock users with dynamic users
  const dynamicUsers = loadDynamicUsers()
  const allUsers = [...mockUsers, ...dynamicUsers]
  
  const user = allUsers.find(u => u.email === email)
  
  if (!user) {
    return null
  }
  
  const isValidPassword = await verifyPassword(password, user.passwordHash)
  
  if (!isValidPassword) {
    return null
  }
  
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const dynamicUsers = loadDynamicUsers()
  const allUsers = [...mockUsers, ...dynamicUsers]
  
  return allUsers.find(u => u.email === email) || null
}

export async function addUser(userData: Omit<User, 'id'> & { password: string }): Promise<User> {
  // This function is implemented in the registration route
  // We'll just return a mock user here since the actual implementation is in the route
  const { password, passwordHash: _, ...userWithoutPassword } = userData
  const passwordHash = await hashPassword(password)
  
  return {
    id: 'temp_id',
    passwordHash,
    ...userWithoutPassword,
  }
}
