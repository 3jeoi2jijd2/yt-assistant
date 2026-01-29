// API Configuration for YT Assistant
// Supports both Netlify and Cloudflare Pages deployments

// Detect which platform we're on based on the URL or env
const isCloudflare = typeof window !== 'undefined' &&
    (window.location.hostname.includes('.pages.dev') ||
        window.location.hostname.includes('cloudflare'));

// API base paths
export const API_BASE = isCloudflare ? '/api' : '/.netlify/functions';

// API endpoints
export const API = {
    // AI & Script Generation
    aiChat: `${API_BASE}/ai-chat`,
    generateScript: `${API_BASE}/generate-script`,

    // Content Generation
    generateTitles: `${API_BASE}/generate-titles`,
    generateHooks: `${API_BASE}/generate-hooks`,
    generateHashtags: `${API_BASE}/generate-hashtags`,
    generateDescription: `${API_BASE}/generate-description`,
    generateCalendar: `${API_BASE}/generate-calendar`,

    // Analysis
    analyzeThumbnail: `${API_BASE}/analyze-thumbnail`,
    analyzeCompetitor: `${API_BASE}/analyze-competitor`,
    analyze: `${API_BASE}/analyze`,

    // Discovery
    getTrends: `${API_BASE}/get-trends`,
    findNiches: `${API_BASE}/find-niches`,
    searchChannels: `${API_BASE}/search-channels`,
};

export default API;
