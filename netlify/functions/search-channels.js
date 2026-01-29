// Search YouTube channels by niche
export async function handler(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { query } = JSON.parse(event.body || '{}');

        if (!query) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Search query is required' })
            };
        }

        const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

        if (!YOUTUBE_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'YouTube API key not configured' })
            };
        }

        // Search for channels
        const searchResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=12&key=${YOUTUBE_API_KEY}`
        );

        if (!searchResponse.ok) {
            const errorData = await searchResponse.json();
            console.error('YouTube API error:', errorData);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to search channels' })
            };
        }

        const searchData = await searchResponse.json();

        if (!searchData.items || searchData.items.length === 0) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ channels: [] })
            };
        }

        // Get channel IDs
        const channelIds = searchData.items.map(item => item.id.channelId).join(',');

        // Get detailed channel statistics
        const statsResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${YOUTUBE_API_KEY}`
        );

        if (!statsResponse.ok) {
            const errorData = await statsResponse.json();
            console.error('YouTube API stats error:', errorData);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to get channel statistics' })
            };
        }

        const statsData = await statsResponse.json();

        // Format channel data
        const channels = statsData.items.map(channel => ({
            id: channel.id,
            title: channel.snippet.title,
            description: channel.snippet.description,
            thumbnail: channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url,
            subscriberCount: channel.statistics.subscriberCount || '0',
            videoCount: channel.statistics.videoCount || '0',
            viewCount: channel.statistics.viewCount || '0'
        }));

        // Sort by subscriber count (highest first)
        channels.sort((a, b) => parseInt(b.subscriberCount) - parseInt(a.subscriberCount));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ channels })
        };

    } catch (error) {
        console.error('Search channels error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to search channels' })
        };
    }
}
