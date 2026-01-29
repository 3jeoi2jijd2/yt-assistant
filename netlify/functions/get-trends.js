// Get trending topics using Groq AI

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
        const { category } = JSON.parse(event.body || '{}');
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const currentDate = new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

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
                        content: `You are a social media trend analyst. Generate 6 trending topics for ${currentDate}.

${category !== 'all' ? `FOCUS CATEGORY: ${category}` : 'INCLUDE: Mix of tech, lifestyle, entertainment, and business trends'}

Return as JSON array:
[
  {
    "title": "Trend name",
    "category": "Tech/Lifestyle/Entertainment/Business/Gaming/Education",
    "growth": "🔥 Exploding" or "↑ 75%" or similar,
    "description": "Brief 1-2 sentence description",
    "contentIdeas": ["idea 1", "idea 2", "idea 3"],
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"]
  }
]

Make trends:
- Timely and relevant to ${currentDate}
- Specific enough to create content about
- Include mix of growth levels
- Return ONLY the JSON array`
                    },
                    {
                        role: 'user',
                        content: `Generate 6 trending topics ${category !== 'all' ? `in the ${category} category` : 'across different categories'} for content creators in ${currentDate}.`
                    }
                ],
                temperature: 0.9,
                max_tokens: 1000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to get trends');
        }

        const content = data.choices[0]?.message?.content || '';

        // Parse JSON from response
        let trends;
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                trends = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch (e) {
            // Fallback trends
            trends = [
                {
                    title: 'AI Tools for Creators',
                    category: 'Tech',
                    growth: '🔥 Exploding',
                    description: 'New AI tools are revolutionizing content creation workflow',
                    contentIdeas: ['Top 5 AI tools I use daily', 'AI vs Manual editing comparison', 'How AI saved me 10 hours/week'],
                    hashtags: ['#AI', '#ContentCreator', '#Productivity']
                }
            ];
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ trends })
        };

    } catch (error) {
        console.error('Get trends error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to get trends' })
        };
    }
}
