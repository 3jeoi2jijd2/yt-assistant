// Analyze transcript using Groq AI
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
        const { transcript } = JSON.parse(event.body || '{}');

        if (!transcript) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Transcript is required' })
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

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert content analyst specializing in YouTube and social media content. 
Analyze the provided video transcript and provide a comprehensive breakdown including:

1. **Key Topics & Themes** - Main subjects discussed
2. **Key Points Summary** - Bullet points of the most important takeaways
3. **Content Structure** - How the content is organized (intro, main points, conclusion)
4. **Engagement Elements** - Hooks, calls to action, and engagement tactics used
5. **Target Audience** - Who this content is aimed at
6. **Content Strengths** - What works well
7. **Improvement Suggestions** - How the content could be better
8. **SEO Keywords** - Main keywords and phrases for discoverability
9. **Viral Potential Score** - Rate 1-10 with explanation

Format your response clearly with headers and bullet points for easy reading.`
                    },
                    {
                        role: 'user',
                        content: `Please analyze this video transcript:\n\n${transcript.substring(0, 8000)}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Groq API error:', errorData);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Failed to analyze transcript' })
            };
        }

        const data = await response.json();
        const analysis = data.choices[0]?.message?.content || 'No analysis generated';

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ analysis })
        };

    } catch (error) {
        console.error('Analyze error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to analyze transcript' })
        };
    }
}
