// Rate limiter using Cloudflare KV (in-memory fallback for dev)
const rateLimits = new Map();

export function checkRateLimit(ip, limit = 30, windowMs = 60000) {
    const now = Date.now();
    const key = ip;

    if (!rateLimits.has(key)) {
        rateLimits.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1 };
    }

    const record = rateLimits.get(key);

    if (now > record.resetAt) {
        // Reset window
        rateLimits.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, remaining: limit - 1 };
    }

    if (record.count >= limit) {
        return { allowed: false, remaining: 0, retryAfter: Math.ceil((record.resetAt - now) / 1000) };
    }

    record.count++;
    return { allowed: true, remaining: limit - record.count };
}

export function getRateLimitHeaders(result) {
    const headers = {};
    headers['X-RateLimit-Remaining'] = String(result.remaining);
    if (result.retryAfter) {
        headers['Retry-After'] = String(result.retryAfter);
    }
    return headers;
}

// Security headers
export const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// CORS headers
export const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// Combined headers
export function getResponseHeaders(rateLimitResult = null) {
    return {
        ...corsHeaders,
        ...securityHeaders,
        'Content-Type': 'application/json',
        ...(rateLimitResult ? getRateLimitHeaders(rateLimitResult) : {})
    };
}

// Validate input
export function sanitizeInput(str, maxLength = 1000) {
    if (typeof str !== 'string') return '';
    return str.trim().slice(0, maxLength);
}

// Error response helper
export function errorResponse(message, status = 400, rateLimitResult = null) {
    return new Response(
        JSON.stringify({ error: message }),
        {
            status,
            headers: getResponseHeaders(rateLimitResult)
        }
    );
}

// Rate limit exceeded response
export function rateLimitResponse(result) {
    return new Response(
        JSON.stringify({
            error: 'Too many requests. Please try again later.',
            retryAfter: result.retryAfter
        }),
        {
            status: 429,
            headers: getResponseHeaders(result)
        }
    );
}
