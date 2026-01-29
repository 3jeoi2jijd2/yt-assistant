// Cloudflare Pages Function: Search Channels

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { query, niche } = await context.request.json();
        const youtubeKey = context.env.YOUTUBE_API_KEY;
        const groqKey = context.env.GROQ_API_KEY;

        if (!groqKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500, headers: corsHeaders
            });
        }

        let channels = [];

        if (youtubeKey) {
            try {
                const searchRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query || niche)}&maxResults=10&key=${youtubeKey}`
                );
                const searchData = await searchRes.json();

                if (searchData.items) {
                    const channelIds = searchData.items.map(c => c.id.channelId).join(',');

                    const channelsRes = await fetch(
                        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelIds}&key=${youtubeKey}`
                    );
                    const channelsData = await channelsRes.json();

                    channels = (channelsData.items || []).map(c => ({
                        id: c.id,
                        name: c.snippet.title,
                        description: c.snippet.description?.substring(0, 150),
                        thumbnail: c.snippet.thumbnails?.medium?.url,
                        subscribers: formatNumber(parseInt(c.statistics.subscriberCount) || 0),
                        videos: c.statistics.videoCount,
                        isRealData: true
                    }));
                }
            } catch (ytError) {
                console.log('YouTube API error:', ytError.message);
            }
        }

        // If no YouTube data, use AI suggestions
        if (channels.length === 0) {
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
                            content: `Suggest creators to study. Return JSON:
[{"name": "Creator name", "description": "What they do", "subscribers": "~1M", "niche": "Their niche", "isRealData": false}]
Generate 5-8 suggestions.`
                        },
                        { role: 'user', content: `Find creators in: ${query || niche}` }
                    ],
                    temperature: 0.7,
                    max_tokens: 600
                })
            });

            const data = await response.json();
            const content = data.choices[0]?.message?.content || '';

            try {
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                channels = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            } catch (e) {
                channels = [];
            }
        }

        return new Response(JSON.stringify({ channels }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: corsHeaders
        });
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
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
