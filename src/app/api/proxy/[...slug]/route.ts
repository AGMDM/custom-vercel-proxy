import { NextRequest, NextResponse } from 'next/server'
import { getAppByName, getAllApps } from '@/lib/config'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleProxy(request, params.slug)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleProxy(request, params.slug)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleProxy(request, params.slug)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleProxy(request, params.slug)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleProxy(request, params.slug)
}

async function handleProxy(request: NextRequest, slugArray: string[]) {
  try {
    console.log('🚀 === PROXY DEBUG START ===')
    console.log('🔍 Proxy: Raw slug array:', slugArray)
    console.log('🔍 Proxy: Slug array length:', slugArray?.length || 0)
    
    if (!slugArray || slugArray.length === 0) {
      console.log('❌ Proxy: No app specified')
      return NextResponse.json({ error: 'No app specified' }, { status: 400 })
    }
    
    const appName = slugArray[0]
    const pathArray = slugArray.slice(1)
    
    console.log('🔍 Proxy: App name:', appName)
    console.log('🔍 Proxy: Path array:', pathArray)
    console.log('🔍 Proxy: Available apps:', getAllApps().map((a) => ({
      name: a.name,
      slug: a.name.toLowerCase().replace(/\s+/g, '-')
    })))
    
    const app = getAppByName(appName)
    console.log('🔍 Proxy: Found app config:', app)
    
    if (!app) {
      console.log('❌ Proxy: No app found for name:', appName)
      console.log('🔍 Proxy: Trying manual slug matching...')
      
      // Manual debug of slug matching
      const allApps = getAllApps()
      for (const testApp of allApps) {
        const testSlug = testApp.name.toLowerCase().replace(/\s+/g, '-')
        console.log(`🔍 Proxy: Testing "${testApp.name}" -> slug: "${testSlug}" vs "${appName}"`)
        if (testSlug === appName) {
          console.log('✅ Proxy: MATCH FOUND manually!')
          // Use the manually found app
          const foundApp = testApp
          const url = new URL(request.url)
          const pathFromArray = pathArray && pathArray.length > 0 ? '/' + pathArray.join('/') : ''
          const targetUrl = `${foundApp.target_url}${pathFromArray}${url.search}`
          
          console.log('🎯 Proxy: Target URL:', targetUrl)
          return await performProxy(request, targetUrl)
        }
      }
      
      console.log('🚀 === PROXY DEBUG END ===')
      return NextResponse.json(
        { error: 'Application not found', available: getAllApps().map(a => a.name) },
        { status: 404 }
      )
    }

    const url = new URL(request.url)
    const pathFromArray = pathArray && pathArray.length > 0 ? '/' + pathArray.join('/') : ''
    const targetUrl = `${app.target_url}${pathFromArray}${url.search}`
    
    console.log('🎯 Proxy: Target URL:', targetUrl)
    
    return await performProxy(request, targetUrl)

  } catch (error) {
    console.error('💥 Proxy error:', error)
    return NextResponse.json(
      { error: 'Proxy request failed' },
      { status: 502 }
    )
  }
}

async function performProxy(request: NextRequest, targetUrl: string) {
  try {
    // Forward the request to the target application
    const headers = new Headers(request.headers)
    
    // Remove host header to avoid conflicts
    headers.delete('host')
    
    // Add original host information
    const url = new URL(request.url)
    headers.set('X-Forwarded-Host', url.host)
    headers.set('X-Forwarded-Proto', url.protocol.slice(0, -1))
    headers.set('X-Forwarded-For', request.ip || 'unknown')

    console.log('📡 Proxy: Making request to:', targetUrl)

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' 
        ? await request.arrayBuffer() 
        : undefined,
    })

    const response = await fetch(proxyRequest)
    
    console.log('📡 Proxy: Response status:', response.status)
    
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

    console.log('✅ Proxy: Successfully forwarded response')
    return proxyResponse

  } catch (error) {
    console.error('💥 Proxy fetch error:', error)
    throw error
  }
}
