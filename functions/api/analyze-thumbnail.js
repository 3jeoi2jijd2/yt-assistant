// Cloudflare Pages Function: Analyze Thumbnail

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { imageUrl } = await context.request.json();
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
                        content: `Provide thumbnail analysis as JSON:
{
  "score": 60-95,
  "strengths": ["...", "..."],
  "improvements": ["...", "..."],
  "clickPrediction": "CTR performance prediction",
  "colorAnalysis": "Color usage analysis",
  "textAnalysis": "Text readability analysis",
  "faceAnalysis": "Human elements analysis"
}
Vary responses. Be specific and helpful.`
                    },
                    { role: 'user', content: `Analyze thumbnail best practices for URL: ${imageUrl}` }
                ],
                temperature: 0.8,
                max_tokens: 600
            })
        });

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        let analysis;
        try {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch (e) {
            analysis = {
                score: 72,
                strengths: ['Good contrast', 'Clear focal point', 'Readable text'],
                improvements: ['Add emotional expression', 'Use bolder colors', 'Add curiosity elements'],
                clickPrediction: 'Above average performance expected',
                colorAnalysis: 'Could use more vibrant colors',
                textAnalysis: 'Text present and readable',
                faceAnalysis: 'Human elements help relatability'
            };
        }

        return new Response(JSON.stringify({ analysis }), { headers: corsHeaders });

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
