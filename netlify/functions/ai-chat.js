// AI Chat endpoint for interactive script generation
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
        const { messages, context } = JSON.parse(event.body || '{}');

        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        if (!GROQ_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        // Get current date for real-time context
        const currentDate = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const systemPrompt = `You are an expert viral content strategist and scriptwriter assistant. Today's date is ${currentDate}.

YOUR ROLE: Guide creators through an interactive conversation to understand their vision, then generate the perfect viral script.

CURRENT 2026 TRENDS YOU KNOW:
- AI-enhanced content is mainstream but authenticity is valued more than ever
- Short-form vertical video dominates (TikTok, Shorts, Reels)
- "Edutainment" - educational content that entertains
- Raw/unfiltered content outperforms polished content
- Story-driven hooks with immediate curiosity gaps
- Community engagement (duets, stitches, reply chains)
- Niche expertise > broad content
- Parasocial connection building
- Series/episodic content gets algorithmic boost

CONVERSATION FLOW:
1. First, greet and ask about their niche/expertise
2. Ask about their target audience
3. Ask about the specific topic/message
4. Ask about their content style (funny, serious, educational, etc.)
5. Ask about the platform (TikTok, YouTube, etc.)
6. Ask about preferred length
7. THEN generate the script with all gathered info

BE CONVERSATIONAL: Chat naturally, ask ONE question at a time, and build rapport. Don't be robotic.

When you have enough info to generate a script, create it with:
- 🎬 TITLE OPTIONS (3 SEO-optimized titles)
- 🎯 THE HOOK (First 3 seconds)
- 📜 FULL SCRIPT (with [PAUSE], [EMPHASIS], [B-ROLL] markers)
- 🔥 VIRAL ELEMENTS (why this will work)
- 🏷️ HASHTAGS & KEYWORDS
- 💡 CREATOR NOTES

${context ? `\nCONTEXT FROM USER: ${JSON.stringify(context)}` : ''}`;

        const apiMessages = [
            { role: 'system', content: systemPrompt },
            ...messages
        ];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: apiMessages,
                temperature: 0.8,
                max_tokens: 4000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Groq API error:', errorData);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to get AI response' })
            };
        }

        const data = await response.json();
        const reply = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ reply })
        };

    } catch (error) {
        console.error('AI Chat error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to process chat: ' + error.message })
        };
    }
}
