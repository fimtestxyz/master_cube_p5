addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  // Set CORS headers for all responses
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  }

  // Handle OPTIONS request for CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    })
  }

  try {
    // Get the URL pathname
    const url = new URL(request.url)
    let path = url.pathname

    // Default to index.html for root path
    if (path === '/' || path === '') {
      path = '/index.html'
    }

    // Fetch the asset from KV or your static assets
    const response = await fetch(`https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO${path}`)
    const contentType = getContentType(path)

    // Create response with proper content type and CORS headers
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType
      }
    })
  } catch (error) {
    return new Response('Not Found', {
      status: 404,
      headers: corsHeaders
    })
  }
}

function getContentType(path) {
  const extension = path.split('.').pop().toLowerCase()
  const types = {
    'html': 'text/html',
    'js': 'application/javascript',
    'css': 'text/css',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav'
  }
  return types[extension] || 'text/plain'
}