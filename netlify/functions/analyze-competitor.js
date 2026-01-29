// Analyze competitor channel using Groq AI

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
        const { channelName } = JSON.parse(event.body || '{}');
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('API key not configured');
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
                        content: `You are a YouTube strategy analyst. Analyze channels/niches and provide actionable insights.

Generate REALISTIC analysis that would help a creator learn from successful competitors.

Return as JSON:
{
  "channelName": "Channel or niche name",
  "subscribers": "Realistic sub count like 125K or 1.2M",
  "avgViews": "Realistic avg views like 50K or 250K",
  "uploadFrequency": "2-3 videos/week",
  "topPerforming": [
    {"title": "Video title example", "views": "1.2M", "why": "Why it performed well"}
  ],
  "contentPattern": "Description of their content strategy",
  "audience": "Who watches this content",
  "opportunities": ["Gap 1 you could fill", "Gap 2", "Gap 3"],
  "lessonsToLearn": ["Lesson 1", "Lesson 2", "Lesson 3"]
}

Be specific and actionable. Return ONLY valid JSON.`
                    },
                    {
                        role: 'user',
                        content: `Analyze this creator/channel/niche and provide strategic insights: "${channelName}"`
                    }
                ],
                temperature: 0.8,
                max_tokens: 800
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to analyze competitor');
        }

        const content = data.choices[0]?.message?.content || '';

        // Parse JSON from response
        let analysis;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                analysis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found');
            }
        } catch (e) {
            // Fallback analysis
            analysis = {
                channelName: channelName,
                subscribers: '500K',
                avgViews: '100K',
                uploadFrequency: '3 videos/week',
                topPerforming: [
                    { title: 'Their most viral video example', views: '2.5M', why: 'Tapped into trending topic with unique angle' },
                    { title: 'Educational content example', views: '800K', why: 'Provided immense value in first 30 seconds' },
                    { title: 'Controversial take example', views: '1.2M', why: 'Bold opinion sparked debate in comments' }
                ],
                contentPattern: 'Consistent format with strong hooks and clear value proposition',
                audience: 'Primarily 18-34, interested in self-improvement and learning',
                opportunities: [
                    'Create more beginner-friendly content',
                    'Cover topics they haven\'t touched yet',
                    'Different content format (Shorts, podcasts)'
                ],
                lessonsToLearn: [
                    'Their thumbnail style drives clicks',
                    'First 5 seconds always have a hook',
                    'Consistent upload schedule builds audience'
                ]
            };
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ analysis })
        };

    } catch (error) {
        console.error('Analyze competitor error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to analyze competitor' })
        };
    }
}
