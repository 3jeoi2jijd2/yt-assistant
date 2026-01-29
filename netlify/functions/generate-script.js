// Generate viral script using Groq AI with 2026 content trends
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

        const systemPrompt = `You are an elite viral content creator and scriptwriter as of January 2026. You have deep knowledge of:

CURRENT 2026 TRENDS:
- AI-enhanced storytelling and content creation
- Split-screen reaction content
- "Story time" format with visual hooks
- Educational entertainment ("edutainment")
- Controversial takes with evidence
- Raw, unfiltered authenticity over polish
- Community-driven content (duets, stitches, replies)
- Short-form documentary style
- "POV" and first-person narratives
- Hook-based content structure

ALGORITHM INSIGHTS (2026):
- First 1-3 seconds determine 70% of video performance
- Comment engagement weighted heavily
- Watch time and rewatch rate are primary metrics
- Shares/Saves matter more than likes
- Posting at non-peak times can help new creators
- Series content gets algorithmic boost

YOUR EXPERTISE:
- Creating hooks that stop scrollers instantly
- Writing in authentic, conversational voice
- Building tension and payoff within scripts
- Using pattern interrupts every 8-15 seconds
- Crafting share-worthy moments
- SEO optimization for discoverability
- Platform-specific optimization

Your scripts consistently go viral because they feel REAL, not scripted.`;

        const userPrompt = `Create a VIRAL ${platformName} script for the "${niche}" niche${topic ? ` about "${topic}"` : ''}.

DATE: January 2026
PLATFORM: ${platformName} ${platform === 'tiktok' ? '(Gen Z/Alpha, fast-paced, trend-aware)' : '(broader demographics, more depth allowed)'}
LENGTH: ${length.words} words (${length.duration})

REQUIREMENTS:
1. Pattern-interrupt HOOK in the FIRST LINE that creates instant curiosity
2. Authentic, conversational tone (NOT robotic or AI-sounding)
3. 2-3 "golden nuggets" of genuinely valuable information
4. Built-in engagement prompts (questions, calls to comment)
5. Strong CTA that drives follows/subscribes
6. Current 2026 references and trends where relevant

FORMAT YOUR RESPONSE AS:

**🎬 TITLE OPTIONS**
(3 click-worthy, SEO-optimized titles - use numbers, power words, curiosity gaps)

**🎯 THE HOOK** (First 3 seconds)
[The exact words to say - this MUST stop the scroll]

**📜 FULL SCRIPT**
[Complete script with [PAUSE], [EMPHASIS], and [B-ROLL: description] markers]

**🔥 VIRAL ELEMENTS BREAKDOWN**
- Why this hook works
- Key retention moments
- Shareability factors

**🏷️ HASHTAGS & KEYWORDS**
[Platform-optimized tags for ${platformName}]

**💡 CREATOR NOTES**
- Delivery tips
- Visual suggestions
- Best time to post
- Engagement strategy

Make it feel like a real creator wrote this - natural, engaging, and SHAREABLE!`;

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
                max_tokens: 4000
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
