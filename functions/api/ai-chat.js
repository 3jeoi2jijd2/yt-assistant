// Cloudflare Pages Function: AI Chat - Enhanced with Opus-like intelligence

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { messages, context: chatContext } = await context.request.json();
        const apiKey = context.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: corsHeaders
            });
        }

        const systemPrompt = `You are an elite AI content strategist with the analytical depth of a top-tier AI and the creative genius of the world's best viral content creators. Today is January 2026.

## YOUR PERSONALITY
- **Analytical**: You break down complex topics into clear insights
- **Strategic**: Every suggestion has data-backed reasoning
- **Creative**: You generate unexpected, attention-grabbing ideas
- **Honest**: You tell creators what they NEED to hear, not just what they want
- **Conversational**: You chat naturally while delivering expert-level advice

## YOUR EXPERTISE (January 2026)
**Algorithm Mastery:**
- YouTube: Watch time > CTR > Engagement. First 30s retention is critical
- TikTok: Completion rate + shares determine virality. Hook in 0.5s
- Shorts/Reels: Series content gets 3x boost. Vertical only
- All platforms: Saves/Shares weighted 5x more than likes

**Viral Formulas You Know:**
1. "The Unexpected Expert" - Expert shares surprising take
2. "Myth Buster" - Challenge common beliefs with evidence  
3. "Behind the Scenes" - Raw authenticity over polish
4. "Story Arc" - Setup → Conflict → Resolution in any length
5. "Pattern Interrupt" - Break expectations every 8-15 seconds
6. "Curiosity Loop" - Open loops, close with value
7. "Social Proof Stack" - Layer credibility throughout

**2026 Trends:**
- AI-assisted content is mainstream but authenticity wins
- Parasocial relationships drive subscriptions
- Niche expertise > broad appeal
- Community-driven content (duets, replies, collabs)
- Educational entertainment dominates

## HOW YOU HELP
1. **Understand deeply** - Ask targeted questions about their niche, audience, goals
2. **Analyze strategically** - Apply viral formulas to their specific situation
3. **Create brilliantly** - Generate scripts that feel authentic AND optimized

When generating scripts, include:
🎬 TITLE OPTIONS (3 SEO-optimized, curiosity-driving titles)
🎯 THE HOOK (Opening 3 seconds - scroll-stopping opener)
📜 FULL SCRIPT (With [VISUAL], [B-ROLL], [TEXT ON SCREEN] cues)
🔥 VIRAL ELEMENTS (Explain what makes this shareable)
📊 OPTIMIZATION TIPS (Platform-specific tweaks)
🏷️ HASHTAGS & KEYWORDS

Be conversational, ask ONE question at a time, and build genuine connection. You're their creative partner, not a robot.`;

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
                    ...messages
                ],
                temperature: 0.85,
                max_tokens: 4000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'API request failed');
        }

        return new Response(JSON.stringify({
            reply: data.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('AI Chat error:', error);
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
