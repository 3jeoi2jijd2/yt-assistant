// Search YouTube channels by niche using AI recommendations
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

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        // Use AI to recommend channels in this niche
        const systemPrompt = `You are a YouTube expert with extensive knowledge of creators across all niches as of January 2026. You know the most successful and growing channels in every category.

CRITICAL: You must provide REAL YouTube channel names that actually exist. Include their actual YouTube channel handle (the @username) so users can find them.

When asked about a niche, provide REAL channels including:
- Large established channels (1M+ subscribers)
- Medium growing channels (100K-1M subscribers)  
- Rising stars (10K-100K subscribers)

Be accurate with channel names - these must be real channels that exist on YouTube.`;

        const userPrompt = `Find 8-10 REAL YouTube channels in the "${query}" niche.

IMPORTANT: Only include channels that actually exist on YouTube as of 2026. Include their real @handle.

For each channel, provide:
- Exact channel name (MUST be real)
- Their YouTube @handle (like @MrBeast, @veritasium, etc.)
- Approximate subscriber count (based on your knowledge)
- Approximate video count
- Brief description (1-2 sentences about what they create)

Return as JSON array with this exact format:
[
  {
    "id": "channel-handle",
    "handle": "@ChannelHandle",
    "title": "Real Channel Name",
    "description": "Brief description of their content style",
    "thumbnail": "",
    "subscriberCount": "1500000",
    "videoCount": "250",
    "viewCount": "500000000"
  }
]

Only return the JSON array, no other text. Every channel MUST be a real YouTube channel.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.6,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Groq API error:', errorData);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to search channels' })
            };
        }

        const data = await response.json();
        let channelsText = data.choices[0]?.message?.content || '[]';

        // Extract JSON from response
        const jsonMatch = channelsText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            channelsText = jsonMatch[0];
        }

        let channels = [];
        try {
            channels = JSON.parse(channelsText);
        } catch (e) {
            console.error('Failed to parse channels:', e);
            channels = [];
        }

        // Add proper thumbnails and YouTube links
        channels = channels.map(ch => {
            const handle = ch.handle || `@${ch.id}`;
            return {
                ...ch,
                handle: handle,
                // Use the handle to create proper YouTube channel URL
                youtubeUrl: `https://www.youtube.com/${handle}`,
                thumbnail: `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.title)}&size=88&background=6366f1&color=fff&bold=true`
            };
        });

        // Sort by subscriber count (highest first)
        channels.sort((a, b) => parseInt(b.subscriberCount || 0) - parseInt(a.subscriberCount || 0));

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
            body: JSON.stringify({ error: 'Failed to search channels: ' + error.message })
        };
    }
}
