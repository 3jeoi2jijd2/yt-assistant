// Cloudflare Pages Function: Analyze Competitor - Deep AI Analysis with Real YouTube Data

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
        let recentVideos = [];

        // Fetch real YouTube data
        if (youtubeKey) {
            try {
                // Search for channel
                const searchRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&maxResults=1&key=${youtubeKey}`
                );
                const searchData = await searchRes.json();

                if (searchData.items?.length > 0) {
                    const channelId = searchData.items[0].id.channelId;

                    // Get channel stats
                    const channelRes = await fetch(
                        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,brandingSettings&id=${channelId}&key=${youtubeKey}`
                    );
                    const channelInfo = await channelRes.json();

                    if (channelInfo.items?.length > 0) {
                        const stats = channelInfo.items[0].statistics;
                        const snippet = channelInfo.items[0].snippet;

                        channelData = {
                            id: channelId,
                            name: snippet.title,
                            description: snippet.description,
                            thumbnail: snippet.thumbnails?.high?.url,
                            subscribers: parseInt(stats.subscriberCount) || 0,
                            totalViews: parseInt(stats.viewCount) || 0,
                            videoCount: parseInt(stats.videoCount) || 0,
                            customUrl: snippet.customUrl
                        };

                        // Get top performing videos (all time)
                        const topVideosRes = await fetch(
                            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=viewCount&maxResults=10&key=${youtubeKey}`
                        );
                        const topVideosData = await topVideosRes.json();

                        if (topVideosData.items?.length > 0) {
                            const videoIds = topVideosData.items.map(v => v.id.videoId).join(',');

                            const videoStatsRes = await fetch(
                                `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${youtubeKey}`
                            );
                            const videoStatsData = await videoStatsRes.json();

                            videos = (videoStatsData.items || []).map(v => ({
                                id: v.id,
                                title: v.snippet.title,
                                thumbnail: v.snippet.thumbnails?.medium?.url,
                                views: parseInt(v.statistics.viewCount) || 0,
                                likes: parseInt(v.statistics.likeCount) || 0,
                                comments: parseInt(v.statistics.commentCount) || 0,
                                publishedAt: v.snippet.publishedAt,
                                duration: v.contentDetails.duration
                            }));
                        }

                        // Get recent videos (last 10)
                        const recentRes = await fetch(
                            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=10&key=${youtubeKey}`
                        );
                        const recentData = await recentRes.json();

                        if (recentData.items?.length > 0) {
                            const recentIds = recentData.items.map(v => v.id.videoId).join(',');
                            const recentStatsRes = await fetch(
                                `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${recentIds}&key=${youtubeKey}`
                            );
                            const recentStatsData = await recentStatsRes.json();
                            recentVideos = (recentStatsData.items || []).map(v => ({
                                title: v.snippet.title,
                                views: parseInt(v.statistics.viewCount) || 0,
                                publishedAt: v.snippet.publishedAt
                            }));
                        }
                    }
                }
            } catch (ytError) {
                console.log('YouTube API error:', ytError.message);
            }
        }

        // Calculate metrics
        const avgViews = videos.length > 0 ? videos.reduce((a, v) => a + v.views, 0) / videos.length : 0;
        const avgLikes = videos.length > 0 ? videos.reduce((a, v) => a + v.likes, 0) / videos.length : 0;
        const engagementRate = avgViews > 0 ? ((avgLikes / avgViews) * 100).toFixed(2) : 0;

        // Deep AI Analysis
        const aiPrompt = channelData ? `
ANALYZE THIS YOUTUBE CHANNEL IN DEPTH:

CHANNEL: ${channelData.name}
SUBSCRIBERS: ${formatNumber(channelData.subscribers)}
TOTAL VIEWS: ${formatNumber(channelData.totalViews)}
VIDEOS: ${channelData.videoCount}
AVG VIEWS/VIDEO: ${formatNumber(Math.round(avgViews))}
ENGAGEMENT RATE: ${engagementRate}%

TOP PERFORMING VIDEOS:
${videos.slice(0, 5).map((v, i) => `${i + 1}. "${v.title}" - ${formatNumber(v.views)} views, ${formatNumber(v.likes)} likes`).join('\n')}

RECENT VIDEOS (LAST 10):
${recentVideos.map((v, i) => `${i + 1}. "${v.title}" - ${formatNumber(v.views)} views`).join('\n')}

Provide a COMPREHENSIVE analysis:

1. **CONTENT STRATEGY**: What patterns do you see in their successful content? What formats, topics, hooks?

2. **VIRAL FORMULA**: What specific techniques make their videos perform? Analyze their titles, thumbnails patterns, video structure.

3. **UPLOAD STRATEGY**: Analyze their posting frequency, timing, consistency.

4. **AUDIENCE PSYCHOLOGY**: What emotions do they trigger? What needs do they fulfill?

5. **GROWTH TRAJECTORY**: Based on recent vs top videos, are they growing, plateauing, or declining?

6. **WEAKNESSES**: What gaps or missed opportunities can competitors exploit?

7. **LESSONS TO STEAL**: 5 specific, actionable tactics a new creator should copy.

8. **CONTENT IDEAS**: 5 specific video ideas inspired by their successful content but with unique angles.

Be analytical, specific, and strategic. This is competitive intelligence.
` : `
Analyze creators in the "${channelName}" niche. Provide content strategy insights, viral formulas, and opportunities for new creators.
`;

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
                        content: `You are an elite YouTube growth strategist with deep analytical abilities. You analyze channels like a data scientist combined with a marketing genius. Return structured analysis in JSON format:

{
  "contentStrategy": "Detailed analysis of their content approach",
  "viralFormula": "The specific techniques that drive their success",
  "uploadPattern": "Frequency and timing analysis",
  "audienceInsight": "Psychology of their viewers",
  "growthStatus": "Growing/Plateauing/Declining with reasoning",
  "weaknesses": ["gap1", "gap2", "gap3"],
  "lessonsToSteal": ["specific tactic 1", "tactic 2", "tactic 3", "tactic 4", "tactic 5"],
  "contentIdeas": ["video idea 1", "video idea 2", "video idea 3", "video idea 4", "video idea 5"],
  "overallScore": 85,
  "verdict": "One-line summary of their channel"
}`
                    },
                    { role: 'user', content: aiPrompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
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
                contentStrategy: 'Unable to parse - check AI response',
                viralFormula: 'Analysis unavailable',
                lessonsToSteal: ['Be consistent', 'Focus on hooks', 'Engage comments'],
                contentIdeas: ['Cover trending topics', 'Do collaborations', 'Try new formats'],
                overallScore: 70
            };
        }

        const analysis = {
            // Real YouTube data
            channelName: channelData?.name || channelName,
            channelId: channelData?.id || null,
            thumbnail: channelData?.thumbnail || null,
            subscribers: formatNumber(channelData?.subscribers || 0),
            subscribersRaw: channelData?.subscribers || 0,
            totalViews: formatNumber(channelData?.totalViews || 0),
            videoCount: channelData?.videoCount || 0,
            avgViews: formatNumber(Math.round(avgViews)),
            engagementRate: engagementRate + '%',
            isRealData: !!channelData,

            // Top videos
            topVideos: videos.slice(0, 5).map(v => ({
                id: v.id,
                title: v.title,
                thumbnail: v.thumbnail,
                views: formatNumber(v.views),
                likes: formatNumber(v.likes),
                comments: formatNumber(v.comments)
            })),

            // AI Analysis
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

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
    });
}
