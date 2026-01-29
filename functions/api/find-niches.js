// Cloudflare Pages Function: Find Niches

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { interests, audience } = await context.request.json();
        const apiKey = context.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500, headers: corsHeaders
            });
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
                        content: `Find profitable niches. Return JSON array:
[{
  "name": "Niche name",
  "competition": "Low/Medium/High",
  "monetization": "High/Medium/Low",
  "growth": "Growing/Stable/Declining",
  "description": "Why this niche works",
  "contentIdeas": ["idea1", "idea2", "idea3"],
  "targetAudience": "Who watches this"
}]
Generate 5-6 niches. Be specific and actionable.`
                    },
                    { role: 'user', content: `Interests: ${interests || 'general'}. Target: ${audience || 'general audience'}` }
                ],
                temperature: 0.8,
                max_tokens: 1000
            })
        });

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        let niches;
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            niches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch (e) {
            niches = [{
                name: 'AI Tools & Productivity',
                competition: 'Medium',
                monetization: 'High',
                growth: 'Growing',
                description: 'People seeking efficiency through technology',
                contentIdeas: ['Tool reviews', 'Workflow tutorials', 'Comparisons'],
                targetAudience: 'Professionals and students'
            }];
        }

        return new Response(JSON.stringify({ niches }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: corsHeaders
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
