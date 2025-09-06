import { NextRequest, NextResponse } from 'next/server'
import { getAllApps } from '@/lib/config'

export async function GET(request: NextRequest) {
  try {
    const apps = getAllApps()
    return NextResponse.json({ apps })
  } catch (error) {
    console.error('Failed to get apps:', error)
    return NextResponse.json(
      { error: 'Failed to load applications' },
      { status: 500 }
    )
  }
}
