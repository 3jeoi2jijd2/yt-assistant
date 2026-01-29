// Analyze competitor channel using YouTube Data API + Groq AI for insights

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
        const { channelName } = JSON.parse(event.body || '{}');
        const groqKey = process.env.GROQ_API_KEY;
        const youtubeKey = process.env.YOUTUBE_API_KEY;

        if (!groqKey) {
            throw new Error('Groq API key not configured');
        }

        // Clean up the channel name/handle
        let searchQuery = channelName.trim();
        if (searchQuery.startsWith('@')) {
            searchQuery = searchQuery.substring(1);
        }

        let channelData = null;
        let videos = [];

        // Try to get real YouTube data if API key is available
        if (youtubeKey) {
            try {
                // Search for the channel
                const searchRes = await fetch(
                    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(searchQuery)}&maxResults=1&key=${youtubeKey}`
                );
                const searchData = await searchRes.json();

                if (searchData.items && searchData.items.length > 0) {
                    const channelId = searchData.items[0].id.channelId;
                    const channelSnippet = searchData.items[0].snippet;

                    // Get channel statistics
                    const channelRes = await fetch(
                        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,brandingSettings&id=${channelId}&key=${youtubeKey}`
                    );
                    const channelInfo = await channelRes.json();

                    if (channelInfo.items && channelInfo.items.length > 0) {
                        const stats = channelInfo.items[0].statistics;
                        const snippet = channelInfo.items[0].snippet;

                        channelData = {
                            id: channelId,
                            name: snippet.title,
                            description: snippet.description,
                            customUrl: snippet.customUrl,
                            thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
                            subscribers: formatNumber(parseInt(stats.subscriberCount) || 0),
                            totalViews: formatNumber(parseInt(stats.viewCount) || 0),
                            videoCount: parseInt(stats.videoCount) || 0,
                            country: snippet.country || 'Unknown'
                        };

                        // Get recent popular videos
                        const videosRes = await fetch(
                            `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=viewCount&maxResults=5&key=${youtubeKey}`
                        );
                        const videosData = await videosRes.json();

                        if (videosData.items && videosData.items.length > 0) {
                            const videoIds = videosData.items.map(v => v.id.videoId).join(',');

                            // Get video statistics
                            const videoStatsRes = await fetch(
                                `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${youtubeKey}`
                            );
                            const videoStatsData = await videoStatsRes.json();

                            videos = (videoStatsData.items || []).map(v => ({
                                title: v.snippet.title,
                                views: formatNumber(parseInt(v.statistics.viewCount) || 0),
                                likes: formatNumber(parseInt(v.statistics.likeCount) || 0),
                                comments: formatNumber(parseInt(v.statistics.commentCount) || 0),
                                thumbnail: v.snippet.thumbnails?.medium?.url,
                                publishedAt: v.snippet.publishedAt
                            }));
                        }
                    }
                }
            } catch (ytError) {
                console.log('YouTube API error:', ytError.message);
                // Fall through to AI-only analysis
            }
        }

        // Use Groq AI for strategic insights
        const aiPrompt = channelData
            ? `Analyze this REAL YouTube channel and provide strategic insights:

CHANNEL: ${channelData.name}
SUBSCRIBERS: ${channelData.subscribers}
TOTAL VIEWS: ${channelData.totalViews}
VIDEO COUNT: ${channelData.videoCount}
DESCRIPTION: ${channelData.description?.substring(0, 500)}

TOP VIDEOS:
${videos.map(v => `- "${v.title}" (${v.views} views, ${v.likes} likes)`).join('\n')}

Based on this REAL data, provide:
1. Content pattern analysis
2. Target audience description
3. 3-4 opportunities for competing creators
4. 3-4 lessons to learn from this channel`
            : `Analyze a YouTube creator in this niche: "${channelName}"

Provide realistic, helpful insights for someone wanting to compete or learn from creators in this space:
1. Typical content patterns in this niche
2. Target audience for this niche
3. 3-4 opportunities for new creators
4. 3-4 lessons from successful creators in this niche`;

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
                        content: `You are a YouTube strategy analyst. Provide actionable insights based on channel data.

Return as JSON:
{
  "contentPattern": "Description of their content strategy and patterns",
  "audience": "Who watches this content - demographics and interests",
  "opportunities": ["Opportunity 1", "Opportunity 2", "Opportunity 3"],
  "lessonsToLearn": ["Lesson 1", "Lesson 2", "Lesson 3"]
}

Be specific, actionable, and insightful. Return ONLY valid JSON.`
                    },
                    {
                        role: 'user',
                        content: aiPrompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 600
            })
        });

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content || '';

        // Parse AI insights
        let insights;
        try {
            const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                insights = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON');
            }
        } catch (e) {
            insights = {
                contentPattern: 'Consistent upload schedule with focus on trending topics',
                audience: 'Primarily 18-34 year olds interested in this niche',
                opportunities: ['Create more beginner content', 'Cover underserved subtopics', 'Try different formats'],
                lessonsToLearn: ['Consistency is key', 'Strong thumbnails matter', 'Engage with comments']
            };
        }

        // Build final analysis
        const analysis = {
            channelName: channelData?.name || channelName,
            channelId: channelData?.id || null,
            thumbnail: channelData?.thumbnail || null,
            subscribers: channelData?.subscribers || 'Unknown',
            totalViews: channelData?.totalViews || 'Unknown',
            videoCount: channelData?.videoCount || 'Unknown',
            uploadFrequency: channelData ? estimateUploadFrequency(channelData.videoCount) : 'Unknown',
            isRealData: !!channelData,
            topPerforming: videos.length > 0
                ? videos.slice(0, 3).map(v => ({
                    title: v.title,
                    views: v.views,
                    why: `${v.likes} likes, ${v.comments} comments`
                }))
                : [
                    { title: 'Unable to fetch real videos', views: 'N/A', why: 'YouTube API key not configured or channel not found' }
                ],
            ...insights
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ analysis })
        };

    } catch (error) {
        console.error('Analyze competitor error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to analyze competitor' })
        };
    }
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function estimateUploadFrequency(videoCount) {
    // Rough estimate assuming channel has been active for ~2 years
    const weeksActive = 104;
    const videosPerWeek = videoCount / weeksActive;

    if (videosPerWeek >= 7) return 'Daily';
    if (videosPerWeek >= 3) return '3-5 videos/week';
    if (videosPerWeek >= 1) return '1-2 videos/week';
    if (videosPerWeek >= 0.25) return '1-4 videos/month';
    return 'Occasional';
}
