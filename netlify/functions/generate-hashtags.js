// Generate optimized hashtags using Groq AI

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
        const { topic, platform } = JSON.parse(event.body || '{}');
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const platformGuides = {
            youtube: { count: 15, style: 'Mix of broad and specific keywords. Include searchable terms.' },
            tiktok: { count: 8, style: 'Trendy, short, and viral. Include FYP-related tags.' },
            instagram: { count: 20, style: 'Mix of popular and niche. Community-focused tags.' },
            twitter: { count: 5, style: 'Very minimal, only the most relevant trending tags.' }
        };

        const guide = platformGuides[platform] || platformGuides.youtube;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a hashtag optimization expert for social media. Generate EXACTLY ${guide.count} hashtags.

PLATFORM: ${platform}
STYLE: ${guide.style}

Return as JSON array with format:
[{"tag": "#hashtag", "popularity": "high/medium/low"}, ...]

Rules:
- Include mix of high, medium, and low popularity
- High = broad reach, more competition
- Medium = good balance
- Low = niche, targeted audience
- All hashtags must start with #
- Make them relevant and discoverable
- Return ONLY the JSON array, no other text`
                    },
                    {
                        role: 'user',
                        content: `Generate ${guide.count} optimized hashtags for ${platform} about: "${topic}"`
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to generate hashtags');
        }

        const content = data.choices[0]?.message?.content || '';

        // Parse JSON from response
        let hashtags;
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                hashtags = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch (e) {
            // Fallback: parse line by line
            const lines = content.split('\n').filter(l => l.includes('#'));
            hashtags = lines.map(line => {
                const tagMatch = line.match(/#[\w]+/);
                return {
                    tag: tagMatch ? tagMatch[0] : line.trim(),
                    popularity: 'medium'
                };
            });
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ hashtags })
        };

    } catch (error) {
        console.error('Generate hashtags error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to generate hashtags' })
        };
    }
}
