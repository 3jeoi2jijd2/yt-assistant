// Cloudflare Pages Function: Analyze Competitor (with real YouTube data)

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { channelName } = await context.request.json();
        const groqKey = context.env.GROQ_API_KEY;
        const youtubeKey = context.env.YOUTUBE_API_KEY;

        if (!groqKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: corsHeaders
            });
        }

        let searchQuery = channelName.trim();
        if (searchQuery.startsWith('@')) {
            searchQuery = searchQuery.substring(1);
        }

        let channelData = null;
        let videos = [];

        // Try to get real YouTube data
        if (youtubeKey) {
            try {
                const searchRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&maxResults=1&key=${youtubeKey}`
                );
                const searchData = await searchRes.json();

                if (searchData.items && searchData.items.length > 0) {
                    const channelId = searchData.items[0].id.channelId;

                    const channelRes = await fetch(
                        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${youtubeKey}`
                    );
                    const channelInfo = await channelRes.json();

                    if (channelInfo.items && channelInfo.items.length > 0) {
                        const stats = channelInfo.items[0].statistics;
                        const snippet = channelInfo.items[0].snippet;

                        channelData = {
                            id: channelId,
                            name: snippet.title,
                            description: snippet.description,
                            thumbnail: snippet.thumbnails?.high?.url,
                            subscribers: formatNumber(parseInt(stats.subscriberCount) || 0),
                            totalViews: formatNumber(parseInt(stats.viewCount) || 0),
                            videoCount: parseInt(stats.videoCount) || 0
                        };

                        const videosRes = await fetch(
                            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=viewCount&maxResults=5&key=${youtubeKey}`
                        );
                        const videosData = await videosRes.json();

                        if (videosData.items && videosData.items.length > 0) {
                            const videoIds = videosData.items.map(v => v.id.videoId).join(',');

                            const videoStatsRes = await fetch(
                                `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${youtubeKey}`
                            );
                            const videoStatsData = await videoStatsRes.json();

                            videos = (videoStatsData.items || []).map(v => ({
                                title: v.snippet.title,
                                views: formatNumber(parseInt(v.statistics.viewCount) || 0),
                                likes: formatNumber(parseInt(v.statistics.likeCount) || 0),
                                comments: formatNumber(parseInt(v.statistics.commentCount) || 0)
                            }));
                        }
                    }
                }
            } catch (ytError) {
                console.log('YouTube API error:', ytError.message);
            }
        }

        // Use AI for insights
        const aiPrompt = channelData
            ? `Analyze this REAL YouTube channel:
CHANNEL: ${channelData.name}
SUBSCRIBERS: ${channelData.subscribers}
TOTAL VIEWS: ${channelData.totalViews}
VIDEO COUNT: ${channelData.videoCount}

TOP VIDEOS:
${videos.map(v => `- "${v.title}" (${v.views} views)`).join('\n')}

Provide: content pattern, target audience, 3 opportunities, 3 lessons.`
            : `Analyze creators in this niche: "${channelName}". Provide: content pattern, target audience, 3 opportunities, 3 lessons.`;

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
                        content: `Return JSON only:
{
  "contentPattern": "string",
  "audience": "string",
  "opportunities": ["string", "string", "string"],
  "lessonsToLearn": ["string", "string", "string"]
}`
                    },
                    { role: 'user', content: aiPrompt }
                ],
                temperature: 0.7,
                max_tokens: 600
            })
        });

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content || '';

        let insights;
        try {
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            insights = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
        } catch (e) {
            insights = {
                contentPattern: 'Consistent uploads with strong hooks',
                audience: 'Engaged community interested in niche content',
                opportunities: ['Create unique angles', 'Cover underserved topics', 'Try different formats'],
                lessonsToLearn: ['Consistency matters', 'Thumbnails are key', 'Engage with comments']
            };
        }

        const analysis = {
            channelName: channelData?.name || channelName,
            channelId: channelData?.id || null,
            thumbnail: channelData?.thumbnail || null,
            subscribers: channelData?.subscribers || 'Unknown',
            totalViews: channelData?.totalViews || 'Unknown',
            videoCount: channelData?.videoCount || 'Unknown',
            uploadFrequency: channelData ? estimateFrequency(channelData.videoCount) : 'Unknown',
            isRealData: !!channelData,
            topPerforming: videos.length > 0
                ? videos.slice(0, 3).map(v => ({ title: v.title, views: v.views, why: `${v.likes} likes, ${v.comments} comments` }))
                : [{ title: 'No data available', views: 'N/A', why: 'Add YOUTUBE_API_KEY for real data' }],
            ...insights
        };

        return new Response(JSON.stringify({ analysis }), { headers: corsHeaders });

    } catch (error) {
        console.error('Analyze competitor error:', error);
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

function estimateFrequency(videoCount) {
    const weeksActive = 104;
    const vidsPerWeek = videoCount / weeksActive;
    if (vidsPerWeek >= 7) return 'Daily';
    if (vidsPerWeek >= 3) return '3-5 videos/week';
    if (vidsPerWeek >= 1) return '1-2 videos/week';
    return '1-4 videos/month';
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
