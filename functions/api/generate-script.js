// Cloudflare Pages Function: Generate Script

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { niche, topic, platform, scriptLength } = await context.request.json();
        const apiKey = context.env.GROQ_API_KEY;

        if (!niche) {
            return new Response(JSON.stringify({ error: 'Niche is required' }), {
                status: 400,
                headers: corsHeaders
            });
        }

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: corsHeaders
            });
        }

        const lengthParams = {
            short: { words: '150-300', duration: '30-60 seconds' },
            medium: { words: '500-800', duration: '2-4 minutes' },
            long: { words: '1200-2000', duration: '8-12 minutes' }
        };

        const length = lengthParams[scriptLength] || lengthParams.medium;
        const platformName = platform === 'tiktok' ? 'TikTok' : 'YouTube';

        const systemPrompt = `You are an elite viral content creator and scriptwriter as of January 2026. You have deep knowledge of:

CURRENT 2026 TRENDS:
- AI-enhanced storytelling and content creation
- Split-screen reaction content
- "Story time" format with visual hooks
- Educational entertainment ("edutainment")
- Raw, unfiltered authenticity over polish
- Short-form documentary style
- "POV" and first-person narratives
- Hook-based content structure

ALGORITHM INSIGHTS:
- First 1-3 seconds determine 70% of video performance
- Watch time and rewatch rate are primary metrics
- Shares/Saves matter more than likes
- Series content gets algorithmic boost

Your scripts feel REAL, not scripted.`;

        const userPrompt = `Create a VIRAL ${platformName} script for the "${niche}" niche${topic ? ` about "${topic}"` : ''}.

PLATFORM: ${platformName}
LENGTH: ${length.words} words (${length.duration})

FORMAT:
**🎬 TITLE OPTIONS**
(3 click-worthy, SEO-optimized titles)

**🎯 THE HOOK** (First 3 seconds)

**📜 FULL SCRIPT**
(Include [VISUAL] cues, timestamps, pattern interrupts)

**✨ PRO TIPS**
(Platform-specific advice for this script)`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
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

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'API request failed');
        }

        return new Response(JSON.stringify({
            script: data.choices[0]?.message?.content || 'Failed to generate script.'
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('Generate script error:', error);
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
