// Find unsaturated niches using Groq AI with 2026 trends
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

        if (!category) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Category is required' })
            };
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Groq API key not configured' })
            };
        }

        const systemPrompt = `You are an expert market researcher and content strategist specializing in YouTube and TikTok in January 2026. You have real-time knowledge of:

- Current trending topics and viral content formats in 2026
- AI-generated content trends and regulations
- Short-form video algorithm changes
- Emerging platforms and features (YouTube Shorts, TikTok Shop, etc.)
- Creator economy trends and monetization opportunities
- Generation Alpha and Gen Z content preferences

Your analysis is based on the latest 2026 data including:
- Current viral trends and challenges
- Emerging technology niches (AI, VR, Web3, quantum computing)
- New content formats gaining traction
- Geographic trends and localized content opportunities
- Cross-platform content strategies

Always provide cutting-edge, data-driven insights that help creators find untapped opportunities.`;

        const userPrompt = `Analyze the "${category}" space as of January 2026 and identify 6 UNSATURATED sub-niches with high viral potential for YouTube and TikTok.

Consider these 2026 factors:
- AI content creation tools impact
- New monetization features 
- Algorithm changes favoring certain content types
- Emerging audience segments
- Cross-platform synergies

For each niche, provide EXACTLY this JSON format:
{
  "niches": [
    {
      "name": "Specific niche name",
      "competition": "low" or "medium" or "high",
      "potential": 75-98 (number, higher means more viral potential),
      "description": "2-3 sentences explaining why this niche is underserved in 2026 and what makes it timely NOW",
      "trendingTopics": ["5 specific video ideas that could go viral"],
      "monthlySearches": "estimated monthly searches like '50K-100K'",
      "whyNow": "One sentence on why 2026 is the perfect time for this niche"
    }
  ]
}

Focus on:
1. Sub-niches that are SPECIFIC and ACTIONABLE
2. Topics with growing 2026 interest but few quality creators
3. Content angles specific to current events and trends
4. Niches where a new creator could realistically grow FAST

IMPORTANT: Only return valid JSON, nothing else. Your response must be parseable JSON.`;

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
                temperature: 0.85,
                max_tokens: 3000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Groq API error:', errorData);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to find niches' })
            };
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        // Try to parse the JSON response
        let niches;
        try {
            // Find JSON in the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                niches = parsed.niches || [];
            } else {
                throw new Error('No JSON found');
            }
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            console.error('Raw content:', content);
            // Fallback: create structured response from the text
            niches = [
                {
                    name: `${category} Sub-niche`,
                    competition: 'low',
                    potential: 80,
                    description: 'Unable to parse AI response. Please try again.',
                    trendingTopics: ['trending', 'content', 'ideas'],
                    monthlySearches: 'N/A',
                    whyNow: 'Try again for updated results'
                }
            ];
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ niches })
        };

    } catch (error) {
        console.error('Find niches error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to find niches: ' + error.message })
        };
    }
}
