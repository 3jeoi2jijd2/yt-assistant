import { useState, useRef, useEffect } from 'react';
import { FileText, Sparkles, Copy, Check, Save, Send, Bot, User, MessageSquare, Wand2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { saveScript } from '../lib/supabase';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

export default function ScriptGenerator() {
    const { user } = useAuth();
    const [mode, setMode] = useState<'chat' | 'quick'>('chat');

    // Chat mode state
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Quick mode state
    const [niche, setNiche] = useState('');
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState<'youtube' | 'tiktok'>('youtube');
    const [scriptLength, setScriptLength] = useState<'short' | 'medium' | 'long'>('medium');
    const [loading, setLoading] = useState(false);
    const [script, setScript] = useState('');
    const [copied, setCopied] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    // Auto-scroll to bottom of messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Start chat with initial greeting
    useEffect(() => {
        if (mode === 'chat' && messages.length === 0) {
            startChat();
        }
    }, [mode]);

    const startChat = async () => {
        setChatLoading(true);
        setError('');
        try {
            const response = await fetch('/.netlify/functions/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [{ role: 'user', content: 'Hi! I want to create a viral video script.' }],
                    context: { mode: 'script_generation' }
                })
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response:', text);
                setError('API returned invalid response. Please try again.');
                return;
            }

            if (data.error) {
                setError(data.error);
                return;
            }

            if (data.reply) {
                setMessages([
                    { role: 'user', content: 'Hi! I want to create a viral video script.' },
                    { role: 'assistant', content: data.reply }
                ]);
            }
        } catch (err) {
            console.error('Failed to start chat:', err);
            setError('Failed to connect to AI. Please try again.');
        } finally {
            setChatLoading(false);
        }
    };


    const sendMessage = async () => {
        if (!input.trim() || chatLoading) return;

        const userMessage = input.trim();
        setInput('');
        setError('');

        const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
        setMessages(newMessages);
        setChatLoading(true);

        try {
            const response = await fetch('/.netlify/functions/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: newMessages,
                    context: { mode: 'script_generation' }
                })
            });

            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                console.error('Failed to parse response:', text);
                setError('API returned invalid response. Please try again.');
                return;
            }

            if (data.error) {
                setError(data.error);
                return;
            }

            if (data.reply) {
                setMessages([...newMessages, { role: 'assistant', content: data.reply }]);

                // Check if the response contains a generated script
                if (data.reply.includes('🎬 TITLE OPTIONS') || data.reply.includes('📜 FULL SCRIPT')) {
                    setScript(data.reply);
                }
            }
        } catch (err) {
            console.error('Failed to send message:', err);
            setError('Failed to send message. Please try again.');
        } finally {
            setChatLoading(false);
        }
    };


    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const resetChat = () => {
        setMessages([]);
        setScript('');
        setTimeout(() => startChat(), 100);
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setScript('');
        setSaved(false);
        setLoading(true);

        try {
            const response = await fetch('/.netlify/functions/generate-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ niche, topic, platform, scriptLength })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to generate script');
            }

            setScript(data.script);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to generate script');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(script);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = async () => {
        if (!user || !script) return;

        const title = topic || `${niche} - ${platform}`;
        const { error } = await saveScript(user.id, title, script, platform, niche);
        if (!error) {
            setSaved(true);
        }
    };

    const formatMessage = (content: string) => {
        // Convert markdown-like formatting to styled text
        return content
            .split('\n')
            .map((line, i) => {
                if (line.startsWith('**') && line.endsWith('**')) {
                    return <div key={i} className="font-bold text-lg mt-4 mb-2" style={{ color: 'var(--accent-primary)' }}>{line.replace(/\*\*/g, '')}</div>;
                }
                if (line.startsWith('🎬') || line.startsWith('🎯') || line.startsWith('📜') || line.startsWith('🔥') || line.startsWith('🏷️') || line.startsWith('💡')) {
                    return <div key={i} className="font-bold text-lg mt-4 mb-2" style={{ color: 'var(--accent-primary)' }}>{line}</div>;
                }
                if (line.startsWith('- ')) {
                    return <div key={i} className="ml-4 mb-1">• {line.substring(2)}</div>;
                }
                if (line.startsWith('[') && line.includes(']')) {
                    return <div key={i} className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{line}</div>;
                }
                return <div key={i} className="mb-1">{line || '\u00A0'}</div>;
            });
    };

    return (
        <div className="animate-fadeIn">
            <div className="page-header">
                <h1 className="flex items-center gap-3">
                    <FileText size={32} style={{ color: 'var(--accent-primary)' }} />
                    AI Script Generator
                </h1>
                <p>Generate viral, SEO-optimized scripts through AI conversation</p>
            </div>

            {/* Mode Toggle */}
            <div className="card mb-6">
                <div className="flex gap-2">
                    <button
                        className={`btn ${mode === 'chat' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setMode('chat')}
                        style={{ flex: 1 }}
                    >
                        <MessageSquare size={18} />
                        AI Chat Mode
                    </button>
                    <button
                        className={`btn ${mode === 'quick' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setMode('quick')}
                        style={{ flex: 1 }}
                    >
                        <Wand2 size={18} />
                        Quick Generate
                    </button>
                </div>
            </div>

            {mode === 'chat' ? (
                /* Chat Mode */
                <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
                    <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <div className="flex items-center gap-2">
                            <Bot size={20} style={{ color: 'var(--accent-primary)' }} />
                            <span className="font-semibold">Script AI Assistant</span>
                            <span className="badge badge-success">Online</span>
                        </div>
                        <button onClick={resetChat} className="btn btn-secondary btn-sm">
                            New Chat
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div style={{
                        flex: 1,
                        overflowY: 'auto',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem'
                    }}>
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    gap: '0.75rem',
                                    alignItems: 'flex-start',
                                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                                }}
                            >
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                        : 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}>
                                    {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                                </div>
                                <div style={{
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2))'
                                        : 'var(--surface-secondary)',
                                    borderRadius: '12px',
                                    padding: '0.75rem 1rem',
                                    maxWidth: '80%',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                                        {formatMessage(msg.content)}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {chatLoading && (
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Bot size={18} />
                                </div>
                                <div style={{
                                    background: 'var(--surface-secondary)',
                                    borderRadius: '12px',
                                    padding: '1rem',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{
                        padding: '1rem',
                        borderTop: '1px solid var(--border-color)',
                        display: 'flex',
                        gap: '0.5rem'
                    }}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Type your message..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={chatLoading}
                            style={{ flex: 1 }}
                        />
                        <button
                            onClick={sendMessage}
                            className="btn btn-primary"
                            disabled={chatLoading || !input.trim()}
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            ) : (
                /* Quick Mode */
                <div className="card mb-6">
                    <form onSubmit={handleGenerate}>
                        <div className="flex gap-4 mb-4">
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label">Niche / Category</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., Tech, Gaming, Fitness, Finance..."
                                    value={niche}
                                    onChange={(e) => setNiche(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label">Specific Topic (Optional)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g., iPhone 16 Review, Morning Routine..."
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label">Platform</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className={`btn ${platform === 'youtube' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setPlatform('youtube')}
                                        style={{ flex: 1 }}
                                    >
                                        YouTube
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${platform === 'tiktok' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setPlatform('tiktok')}
                                        style={{ flex: 1 }}
                                    >
                                        TikTok
                                    </button>
                                </div>
                            </div>

                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label">Script Length</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className={`btn ${scriptLength === 'short' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setScriptLength('short')}
                                        style={{ flex: 1 }}
                                    >
                                        Short
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${scriptLength === 'medium' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setScriptLength('medium')}
                                        style={{ flex: 1 }}
                                    >
                                        Medium
                                    </button>
                                    <button
                                        type="button"
                                        className={`btn ${scriptLength === 'long' ? 'btn-primary' : 'btn-secondary'}`}
                                        onClick={() => setScriptLength('long')}
                                        style={{ flex: 1 }}
                                    >
                                        Long
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                            {loading ? (
                                <>
                                    <div className="loading-spinner" style={{ width: '20px', height: '20px' }}></div>
                                    Generating Viral Script...
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Generate Script
                                </>
                            )}
                        </button>
                    </form>
                </div>
            )}

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            {script && (
                <div className="card animate-slideUp">
                    <div className="card-header">
                        <div>
                            <h3 className="card-title flex items-center gap-2">
                                <Sparkles size={20} style={{ color: 'var(--accent-primary)' }} />
                                Generated Script
                            </h3>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleCopy} className="btn btn-secondary btn-sm">
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                            <button onClick={handleSave} className="btn btn-secondary btn-sm" disabled={saved}>
                                <Save size={16} />
                                {saved ? 'Saved!' : 'Save'}
                            </button>
                        </div>
                    </div>
                    <div className="script-content">
                        {formatMessage(script)}
                    </div>
                </div>
            )}
        </div>
    );
}
