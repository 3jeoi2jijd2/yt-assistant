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

When asked about a niche, provide REAL YouTube channels that exist and are active. Include a mix of:
- Large established channels (1M+ subscribers)
- Medium growing channels (100K-1M subscribers)  
- Rising stars (10K-100K subscribers)

Be accurate with channel names and approximate statistics based on your knowledge.`;

        const userPrompt = `Find 8-10 top YouTube channels in the "${query}" niche.

For each channel, provide:
- Exact channel name (real channels only)
- Approximate subscriber count (as of 2026)
- Approximate total video count
- Approximate total view count
- Brief description of their content (1-2 sentences)

Return as JSON array with this exact format:
[
  {
    "id": "channel-name-slug",
    "title": "Channel Name",
    "description": "Brief description of what they create",
    "thumbnail": "",
    "subscriberCount": "1500000",
    "videoCount": "250",
    "viewCount": "500000000"
  }
]

Only return the JSON array, no other text.`;

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
                temperature: 0.7,
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

        // Add placeholder thumbnails
        channels = channels.map(ch => ({
            ...ch,
            thumbnail: `https://ui-avatars.com/api/?name=${encodeURIComponent(ch.title)}&size=88&background=6366f1&color=fff`
        }));

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
