// Get trending topics using real YouTube Trending + Groq AI for insights

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
        const { category } = JSON.parse(event.body || '{}');
        const groqKey = process.env.GROQ_API_KEY;
        const youtubeKey = process.env.YOUTUBE_API_KEY;

        if (!groqKey) {
            throw new Error('Groq API key not configured');
        }

        const currentDate = new Date().toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        let realTrendingVideos = [];

        // Try to get real YouTube trending videos
        if (youtubeKey) {
            try {
                // Map categories to YouTube video category IDs
                const categoryMap = {
                    'tech': '28',      // Science & Technology
                    'gaming': '20',    // Gaming
                    'entertainment': '24', // Entertainment
                    'education': '27', // Education
                    'lifestyle': '22', // People & Blogs / Howto
                    'business': '28',  // Science & Tech (closest match)
                    'all': ''          // No filter
                };

                const videoCategoryId = categoryMap[category] || '';
                let url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=10&key=${youtubeKey}`;

                if (videoCategoryId) {
                    url += `&videoCategoryId=${videoCategoryId}`;
                }

                const trendingRes = await fetch(url);
                const trendingData = await trendingRes.json();

                if (trendingData.items && trendingData.items.length > 0) {
                    realTrendingVideos = trendingData.items.map(video => ({
                        title: video.snippet.title,
                        channel: video.snippet.channelTitle,
                        views: formatNumber(parseInt(video.statistics.viewCount) || 0),
                        likes: formatNumber(parseInt(video.statistics.likeCount) || 0),
                        thumbnail: video.snippet.thumbnails?.medium?.url,
                        publishedAt: video.snippet.publishedAt,
                        categoryId: video.snippet.categoryId
                    }));
                }
            } catch (ytError) {
                console.log('YouTube API error:', ytError.message);
            }
        }

        // Use AI to analyze trends and generate content ideas
        const aiPrompt = realTrendingVideos.length > 0
            ? `Analyze these REAL trending YouTube videos from ${currentDate} and identify content trends:

TRENDING NOW:
${realTrendingVideos.slice(0, 8).map(v => `- "${v.title}" by ${v.channel} (${v.views} views)`).join('\n')}

Based on these REAL trending videos, create 6 trend opportunities for content creators.
Each should include the trend name, category, growth indicator, description, 3 content ideas, and 3 hashtags.
Focus on underlying patterns and topics, not just copying exact videos.`
            : `Generate 6 trending content topics for ${currentDate} in the ${category !== 'all' ? category : 'general'} space.
Focus on real, actionable trends that content creators can capitalize on.`;

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
                        content: `You are a social media trend analyst for ${currentDate}. 

${category !== 'all' ? `FOCUS CATEGORY: ${category}` : ''}

Return EXACTLY as JSON array:
[
  {
    "title": "Trend name",
    "category": "Tech/Lifestyle/Entertainment/Business/Gaming/Education",
    "growth": "🔥 Exploding" or "↑ 75%" (vary these),
    "description": "2 sentence description of why this is trending",
    "contentIdeas": ["Specific video idea 1", "Specific video idea 2", "Specific video idea 3"],
    "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
    "isRealData": ${realTrendingVideos.length > 0}
  }
]

Make trends timely, specific, and actionable. Return ONLY the JSON array.`
                    },
                    {
                        role: 'user',
                        content: aiPrompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 1200
            })
        });

        const aiData = await aiResponse.json();
        const aiContent = aiData.choices?.[0]?.message?.content || '';

        // Parse trends
        let trends;
        try {
            const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                trends = JSON.parse(jsonMatch[0]);
                // Add isRealData flag
                trends = trends.map(t => ({
                    ...t,
                    isRealData: realTrendingVideos.length > 0
                }));
            } else {
                throw new Error('No JSON');
            }
        } catch (e) {
            // Fallback
            trends = [
                {
                    title: 'AI Tools for Creators',
                    category: 'Tech',
                    growth: '🔥 Exploding',
                    description: 'AI-powered content creation tools are transforming how creators work',
                    contentIdeas: ['Top 5 AI tools I use daily', 'AI vs Manual editing', 'Free AI tools review'],
                    hashtags: ['#AITools', '#ContentCreator', '#Productivity'],
                    isRealData: false
                }
            ];
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                trends,
                realTrendingVideos: realTrendingVideos.slice(0, 5) // Include raw trending data
            })
        };

    } catch (error) {
        console.error('Get trends error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to get trends' })
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
