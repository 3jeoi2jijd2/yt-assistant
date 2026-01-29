// Generate viral script using Groq AI
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
        const { niche, topic, platform, scriptLength } = JSON.parse(event.body || '{}');

        if (!niche) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Niche is required' })
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

        // Determine length parameters
        const lengthParams = {
            short: { words: '150-300', duration: '30-60 seconds' },
            medium: { words: '500-800', duration: '2-4 minutes' },
            long: { words: '1200-2000', duration: '8-12 minutes' }
        };

        const length = lengthParams[scriptLength] || lengthParams.medium;
        const platformName = platform === 'tiktok' ? 'TikTok' : 'YouTube';

        const systemPrompt = `You are an expert viral content creator and scriptwriter who has generated scripts for videos with millions of views. You understand what makes content go viral on ${platformName}.

Your scripts are known for:
- Compelling hooks that stop the scroll in the first 3 seconds
- Natural, conversational language that sounds human (not AI-generated)
- Strategic pattern interrupts to maintain attention
- Emotional storytelling that connects with viewers
- Clear value delivery that keeps viewers watching
- Strong calls to action that drive engagement
- SEO-optimized titles and descriptions

You write scripts that feel authentic, relatable, and shareable.`;

        const userPrompt = `Create a viral ${platformName} script for the "${niche}" niche${topic ? ` about "${topic}"` : ''}.

Requirements:
- Length: ${length.words} words (approximately ${length.duration})
- Platform: ${platformName} ${platform === 'tiktok' ? '(fast-paced, trendy, younger audience)' : '(can be more detailed, wider demographics)'}
- Must include a pattern-interrupt hook in the first line
- Write in a conversational, authentic tone
- Include 2-3 "golden nuggets" of value
- End with a strong call to action

Please format your script with:

**🎬 TITLE OPTIONS** (3 SEO-optimized title options)

**🎯 HOOK** (First 3 seconds - the most important part)

**📜 FULL SCRIPT**
(The complete script with natural pauses and emphasis marked)

**🏷️ HASHTAGS & KEYWORDS**
(Relevant tags for ${platformName})

**💡 CREATOR NOTES**
(Tips for delivery, b-roll suggestions, etc.)

Make it sound human, engaging, and shareable!`;

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
                body: JSON.stringify({ error: 'Failed to generate script' })
            };
        }

        const data = await response.json();
        const script = data.choices[0]?.message?.content || 'No script generated';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ script })
        };

    } catch (error) {
        console.error('Generate script error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to generate script' })
        };
    }
}
