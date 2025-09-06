import { NextRequest, NextResponse } from 'next/server'
import { getAppByName } from '@/lib/config'

export async function GET(
  request: NextRequest,
  { params }: { params: { app: string } }
) {
  return handleProxy(request, params.app)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { app: string } }
) {
  return handleProxy(request, params.app)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { app: string } }
) {
  return handleProxy(request, params.app)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { app: string } }
) {
  return handleProxy(request, params.app)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { app: string } }
) {
  return handleProxy(request, params.app)
}

async function handleProxy(request: NextRequest, appName: string) {
  try {
    const app = getAppByName(appName)
    
    if (!app) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    const url = new URL(request.url)
    const targetPath = url.pathname.replace(`/proxy/${appName}`, '')
    const targetUrl = `${app.target_url}${targetPath}${url.search}`

    // Forward the request to the target application
    const headers = new Headers(request.headers)
    
    // Remove host header to avoid conflicts
    headers.delete('host')
    
    // Add original host information
    headers.set('X-Forwarded-Host', url.host)
    headers.set('X-Forwarded-Proto', url.protocol.slice(0, -1))
    headers.set('X-Forwarded-For', request.ip || 'unknown')

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.arrayBuffer() 
        : undefined,
    })

    const response = await fetch(proxyRequest)
    
    // Create response with the same body and status
    const responseBody = await response.arrayBuffer()
    const proxyResponse = new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
    })

    // Copy headers from the target response
    response.headers.forEach((value, key) => {
      // Skip some headers that might cause issues
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(key.toLowerCase())) {
        proxyResponse.headers.set(key, value)
      }
    })

    return proxyResponse

  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 502 }
    )
  }
}
