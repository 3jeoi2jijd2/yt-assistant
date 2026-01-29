// Cloudflare Pages Function: Get Trends (with real YouTube trending)

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { category } = await context.request.json();
        const groqKey = context.env.GROQ_API_KEY;
        const youtubeKey = context.env.YOUTUBE_API_KEY;

        if (!groqKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: corsHeaders
            });
        }

        const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        let realTrendingVideos = [];

        if (youtubeKey) {
            try {
                const categoryMap = {
                    'tech': '28',
                    'gaming': '20',
                    'entertainment': '24',
                    'education': '27',
                    'lifestyle': '22',
                    'all': ''
                };

                const videoCategoryId = categoryMap[category] || '';
                let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=10&key=${youtubeKey}`;

                if (videoCategoryId) {
                    url += `&videoCategoryId=${videoCategoryId}`;
                }

                const trendingRes = await fetch(url);
                const trendingData = await trendingRes.json();

                if (trendingData.items) {
                    realTrendingVideos = trendingData.items.map(video => ({
                        title: video.snippet.title,
                        channel: video.snippet.channelTitle,
                        views: formatNumber(parseInt(video.statistics.viewCount) || 0),
                        likes: formatNumber(parseInt(video.statistics.likeCount) || 0),
                        thumbnail: video.snippet.thumbnails?.medium?.url,
                        publishedAt: video.snippet.publishedAt
                    }));
                }
            } catch (ytError) {
                console.log('YouTube API error:', ytError.message);
            }
        }

        const aiPrompt = realTrendingVideos.length > 0
            ? `These are REAL trending YouTube videos from ${currentDate}:
${realTrendingVideos.slice(0, 8).map(v => `- "${v.title}" by ${v.channel} (${v.views} views)`).join('\n')}

Identify 6 content trends/opportunities based on these REAL videos.`
            : `Generate 6 trending content topics for ${currentDate}${category !== 'all' ? ` in ${category}` : ''}.`;

        const aiResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
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
                        content: `Return 6 trends as JSON array only:
[{"title": "Trend name", "category": "Tech/Gaming/etc", "growth": "🔥 Exploding", "description": "Why trending", "contentIdeas": ["idea1", "idea2", "idea3"], "hashtags": ["#tag1", "#tag2", "#tag3"]}]`
                    },
                    { role: 'user', content: aiPrompt }
                ],
                temperature: 0.8,
                max_tokens: 1000
            })
        });

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content || '';

        let trends;
        try {
            const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
            trends = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            trends = trends.map(t => ({ ...t, isRealData: realTrendingVideos.length > 0 }));
        } catch (e) {
            trends = [{
                title: 'AI Tools for Creators',
                category: 'Tech',
                growth: '🔥 Exploding',
                description: 'AI tools transforming content creation',
                contentIdeas: ['Top AI tools', 'AI vs manual', 'Free AI tools'],
                hashtags: ['#AI', '#ContentCreator', '#Productivity'],
                isRealData: false
            }];
        }

        return new Response(JSON.stringify({
            trends,
            realTrendingVideos: realTrendingVideos.slice(0, 5)
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('Get trends error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
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
