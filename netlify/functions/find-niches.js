// Find unsaturated niches using Groq AI
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

        const systemPrompt = `You are an expert market researcher and content strategist specializing in YouTube and TikTok. You have deep knowledge of trending topics, audience behavior, and content gaps across all niches.

Your expertise includes:
- Identifying underserved sub-niches with high growth potential
- Analyzing competition levels accurately
- Predicting viral trends before they explode
- Understanding search volume and audience demand
- Spotting content gaps that creators can fill

Always provide data-driven, actionable insights that help creators find their unique angle.`;

        const userPrompt = `Analyze the "${category}" space and identify 5 UNSATURATED sub-niches with high viral potential for YouTube and TikTok.

For each niche, provide EXACTLY this JSON format:
{
  "niches": [
    {
      "name": "Specific niche name",
      "competition": "low" or "medium" or "high",
      "potential": 75-95 (number, higher means more viral potential),
      "description": "2-3 sentences explaining why this niche is underserved and why it has potential",
      "trendingTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
      "monthlySearches": "estimated monthly searches like '50K-100K'"
    }
  ]
}

Focus on:
1. Sub-niches that are SPECIFIC (not broad)
2. Topics with growing interest but few quality creators
3. Content angles that haven't been fully explored
4. Niches where a new creator could realistically grow

IMPORTANT: Only return valid JSON, nothing else. Your response must be parseable JSON.`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.8,
                max_tokens: 2000
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
            // Fallback: create structured response from the text
            niches = [
                {
                    name: `${category} Sub-niche`,
                    competition: 'low',
                    potential: 80,
                    description: 'Unable to parse AI response. Please try again.',
                    trendingTopics: ['trending', 'content', 'ideas'],
                    monthlySearches: 'N/A'
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
            body: JSON.stringify({ error: 'Failed to find niches' })
        };
    }
}
