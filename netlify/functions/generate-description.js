// Generate SEO-optimized video descriptions using Groq AI

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
        const { title, topic, platform, includeTimestamps, includeCTA } = JSON.parse(event.body || '{}');
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const platformGuides = {
            youtube: 'Write for YouTube SEO. First 2-3 lines are crucial (shown before "Show more"). Include keywords naturally.',
            tiktok: 'Keep it short and punchy. Use line breaks. Emojis are good. Include trending sounds if relevant.',
            instagram: 'Story-telling style. Use emojis. Include value proposition. Call to action for saves/shares.'
        };

        let instructions = `Write an engaging, SEO-optimized video description for ${platform}.

VIDEO TITLE: ${title}
${topic ? `TOPIC DETAILS: ${topic}` : ''}

PLATFORM STYLE: ${platformGuides[platform] || platformGuides.youtube}`;

        if (includeTimestamps) {
            instructions += `

INCLUDE TIMESTAMPS: Create 5-7 realistic chapter timestamps like:
0:00 - Hook
0:45 - First Key Point
...etc`;
        }

        if (includeCTA) {
            instructions += `

INCLUDE CTAs: Add natural calls to action for:
- Subscribe with notification bell
- Like if they found value
- Comment their thoughts`;
        }

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
                        content: `You are an expert at writing video descriptions that boost SEO and engagement.

Rules:
- Start with a compelling hook in the first line
- Include relevant keywords naturally
- Use line breaks for readability
- Make it scannable with emojis or bullets
- Sound authentic, not spammy
- Include relevant hashtags at the end`
                    },
                    {
                        role: 'user',
                        content: instructions
                    }
                ],
                temperature: 0.8,
                max_tokens: 800
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to generate description');
        }

        const description = data.choices[0]?.message?.content || '';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ description })
        };

    } catch (error) {
        console.error('Generate description error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to generate description' })
        };
    }
}
