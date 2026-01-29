// Cloudflare Pages Function: TikTok Trend Analyzer

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { niche, question } = await context.request.json();
        const groqKey = context.env.GROQ_API_KEY;

        if (!groqKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: corsHeaders
            });
        }

        // If chat question
        if (question) {
            const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        {
                            role: 'system',
                            content: `You are a TikTok growth expert in January 2026. You know the latest trends, sounds, formats, and algorithm secrets. Answer questions about TikTok strategy, content creation, and growth. Be specific and actionable. Use emojis sparingly.

Current TikTok knowledge (Jan 2026):
- Completion rate is #1 ranking factor
- First 0.5 seconds determines scroll-stop
- Saves and shares weighted 5x more than likes
- Series content gets 3x algorithm boost
- Reply videos and stitches get priority
- Consistency > quantity
- Sound selection crucial for discoverability`
                        },
                        { role: 'user', content: question }
                    ],
                    temperature: 0.8,
                    max_tokens: 800
                })
            });

            const chatData = await chatRes.json();
            return new Response(JSON.stringify({
                chatResponse: chatData.choices?.[0]?.message?.content
            }), { headers: corsHeaders });
        }

        // Get TikTok trends and analysis
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are a TikTok trend analyst in January 2026. Return JSON with current TikTok insights:

{
  "trendingSounds": [
    {"name": "Sound name", "description": "What it sounds like", "usage": "How creators use it", "potential": "high/medium/low"}
  ],
  "trendingFormats": [
    {"name": "Format name", "description": "What this format is", "example": "Example video idea", "difficulty": "easy/medium/hard"}
  ],
  "viralHooks": [
    {"hook": "The hook text or pattern", "whyItWorks": "Psychology behind it"}
  ],
  "nicheOpportunities": [
    {"niche": "Niche name", "growth": "Growing/Saturated/Emerging", "strategy": "How to enter"}
  ],
  "algorithmTips": ["tip1", "tip2", "tip3"],
  "contentIdeas": [
    {"idea": "Video idea", "format": "Format type", "estimatedViews": "10K-100K", "difficulty": "easy"}
  ]
}`
                    },
                    {
                        role: 'user',
                        content: niche
                            ? `Analyze TikTok trends and opportunities for the "${niche}" niche. Include sounds, formats, and content ideas specific to this niche.`
                            : 'What are the current TikTok trends, viral formats, and opportunities in January 2026? Include trending sounds, hook formulas, and algorithm tips.'
                    }
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        let trends;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            trends = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch (e) {
            trends = {
                trendingSounds: [],
                trendingFormats: [],
                viralHooks: [],
                nicheOpportunities: [],
                algorithmTips: ['Post consistently', 'Hook in first 0.5s', 'Use trending sounds'],
                contentIdeas: []
            };
        }

        return new Response(JSON.stringify({ trends }), { headers: corsHeaders });

    } catch (error) {
        console.error('TikTok analysis error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
    });
}
