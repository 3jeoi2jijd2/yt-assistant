// Cloudflare Pages Function - AI Chat
// POST /api/ai-chat

export async function onRequest(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (context.request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const groqKey = context.env.GROQ_API_KEY;
        if (!groqKey) {
            throw new Error('Missing Groq API key');
        }

        const { messages } = await context.request.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Call Groq AI
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages.map(m => ({
                    role: m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : 'assistant',
                    content: m.content
                })),
                temperature: 0.8,
                max_tokens: 600
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Groq error:', errText);
            throw new Error('AI service error');
        }

        const data = await response.json();
        const message = data.choices?.[0]?.message?.content || 'I could not generate a response.';

        return new Response(JSON.stringify({ message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI Chat error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to chat' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
