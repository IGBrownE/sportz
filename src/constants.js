export const ERRORS = {
    FORBIDDEN: { code: 403, text: 'Too many requests' },
    TOO_MANY: { code: 429, text: '' },
    UNAVAILABLE: { code: 503, text: 'Service unavailable' },
    RATE_LIMIT: { code: 1013, text: 'Rate limit exceeded' },
    ACCESS_DENIED: { code: 1008, text: 'Access denied' },
    SECURITY_ERROR: { code: 1011, text: 'Server security error' },
}