// Generate content calendar using Groq AI

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
        const { niche } = JSON.parse(event.body || '{}');
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const types = ['📺 Long-form', '⚡ Short', '🎵 TikTok', '📸 Reel'];

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
                        content: `You are a content strategist. Generate a week of content ideas for a creator.

NICHE: ${niche}
DAYS: ${days.join(', ')}
CONTENT TYPES: ${types.join(', ')}

Return as JSON array:
[
  {
    "id": "unique-id",
    "day": "Monday",
    "title": "Content idea title",
    "type": "📺 Long-form",
    "status": "idea"
  }
]

Rules:
- Generate 7-10 content ideas across the week
- Mix of content types
- Spread evenly across days (1-2 per day)
- Titles should be specific and actionable
- All status should be "idea"
- Return ONLY the JSON array`
                    },
                    {
                        role: 'user',
                        content: `Generate a week of content ideas for a ${niche} creator`
                    }
                ],
                temperature: 0.9,
                max_tokens: 800
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to generate calendar');
        }

        const content = data.choices[0]?.message?.content || '';

        // Parse JSON from response
        let ideas;
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                ideas = JSON.parse(jsonMatch[0]);
                // Ensure unique IDs
                ideas = ideas.map((idea, i) => ({
                    ...idea,
                    id: idea.id || `idea-${Date.now()}-${i}`,
                    status: 'idea'
                }));
            } else {
                throw new Error('No JSON found');
            }
        } catch (e) {
            // Fallback
            ideas = days.map((day, i) => ({
                id: `idea-${Date.now()}-${i}`,
                day,
                title: `${niche} content idea for ${day}`,
                type: types[i % types.length],
                status: 'idea'
            }));
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ ideas })
        };

    } catch (error) {
        console.error('Generate calendar error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to generate calendar' })
        };
    }
}
