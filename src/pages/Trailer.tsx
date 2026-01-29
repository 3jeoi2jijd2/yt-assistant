import { useState, useEffect, useRef } from 'react';
import { Sparkles, TrendingUp, Search, Eye, Crown, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Import actual components to reuse their UI
// We will wrap them or mock their internal state if needed
// For this trailer, we might need to recreate the visual parts to have full control over the animation

export default function Trailer() {
    const [scene, setScene] = useState(0);
    const [typedText, setTypedText] = useState('');
    const fullText = "@MrBeast";
    const navigate = useNavigate();

    // Scene timings
    useEffect(() => {
        // Scene 0: Intro (3s)
        const timer1 = setTimeout(() => setScene(1), 3000);

        // Scene 1: Dashboard/Trend Radar (5s)
        const timer2 = setTimeout(() => setScene(2), 9000);

        // Scene 2: Competitor Spy Typing (6s)
        const timer3 = setTimeout(() => setScene(3), 16000);

        // Scene 3: Outro

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    // Typing effect for Scene 2
    useEffect(() => {
        if (scene === 2) {
            let i = 0;
            const typing = setInterval(() => {
                if (i <= fullText.length) {
                    setTypedText(fullText.slice(0, i));
                    i++;
                } else {
                    clearInterval(typing);
                }
            }, 100); // Typing speed
            return () => clearInterval(typing);
        } else {
            setTypedText('');
        }
    }, [scene]);

    // Render Scenes
    return (
        <div className="min-h-screen bg-slate-950 text-white overflow-hidden relative font-sans">
            {/* Global shapes for all pages - reused from App.tsx/index.css */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-400 rounded-full blur-[100px] opacity-20 animate-float-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[100px] opacity-20 animate-float-delayed"></div>

            {/* SCENE 0: INTRO */}
            {scene === 0 && (
                <div className="flex flex-col items-center justify-center h-screen animate-fadeIn">
                    <div className="transform scale-150 mb-8 p-8 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 relative z-10 animate-bounce-slow">
                        <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-10 rounded-3xl"></div>
                        <Sparkles size={120} className="text-yellow-400 animate-pulse" />
                    </div>
                    <h1 className="text-8xl font-black bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-4 tracking-tight">
                        TubeRocket
                    </h1>
                    <p className="text-3xl text-slate-400 font-medium">STOP GUESSING. START GROWING.</p>
                </div>
            )}

            {/* SCENE 1: TREND RADAR */}
            {scene === 1 && (
                <div className="h-screen p-8 animate-slideUp">
                    <div className="max-w-6xl mx-auto">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-4 bg-red-600 rounded-2xl shadow-lg shadow-red-600/20">
                                <TrendingUp size={48} className="text-white" />
                            </div>
                            <div>
                                <h2 className="text-5xl font-black text-white">Trend Radar</h2>
                                <p className="text-2xl text-slate-400">Viral Content Detected</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl transform transition-all duration-1000 translate-y-0 opacity-100 shadow-2xl">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-red-500/20 text-red-400 px-4 py-1 rounded-full text-sm font-bold flex items-center gap-2">
                                            <TrendingUp size={16} /> Exploding
                                        </span>
                                        <span className="text-slate-500 font-mono">Just now</span>
                                    </div>
                                    <div className="h-40 bg-slate-800 rounded-2xl mb-4 animate-pulse"></div>
                                    <div className="h-8 bg-slate-800 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-12 text-center">
                            <h3 className="text-4xl font-bold text-yellow-400 animate-pulse">
                                SPOT VIRAL WAVES BEFORE THEY HAPPEN
                            </h3>
                        </div>
                    </div>
                </div>
            )}

            {/* SCENE 2: COMPETITOR SPY */}
            {scene === 2 && (
                <div className="h-screen p-8 animate-fadeIn">
                    <div className="max-w-4xl mx-auto pt-20">
                        <div className="text-center mb-12">
                            <div className="inline-flex p-6 bg-purple-600 rounded-3xl shadow-2xl shadow-purple-600/30 mb-6">
                                <Eye size={64} className="text-white" />
                            </div>
                            <h2 className="text-6xl font-black text-white mb-4">Competitor Spy</h2>
                            <p className="text-3xl text-slate-400">Steal Their Strategy</p>
                        </div>

                        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-2xl transform scale-110">
                            <Search size={32} className="text-slate-400 ml-4" />
                            <div className="flex-1 text-4xl font-medium text-slate-800 font-mono">
                                {typedText}<span className="animate-blink text-purple-600">|</span>
                            </div>
                            <button className="bg-purple-600 text-white px-8 py-4 rounded-xl text-xl font-bold">
                                Analyze
                            </button>
                        </div>

                        {typedText === fullText && (
                            <div className="mt-12 grid grid-cols-3 gap-6 animate-slideUp">
                                <div className="bg-slate-900 border border-purple-500/50 p-6 rounded-2xl">
                                    <div className="text-purple-400 text-sm font-bold mb-2">AVG VIEWS</div>
                                    <div className="text-4xl font-black text-white">4.2M</div>
                                </div>
                                <div className="bg-slate-900 border border-purple-500/50 p-6 rounded-2xl">
                                    <div className="text-purple-400 text-sm font-bold mb-2">VIRAL SCORE</div>
                                    <div className="text-4xl font-black text-white">98/100</div>
                                </div>
                                <div className="bg-slate-900 border border-purple-500/50 p-6 rounded-2xl">
                                    <div className="text-purple-400 text-sm font-bold mb-2">ENGAGEMENT</div>
                                    <div className="text-4xl font-black text-white">High</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SCENE 3: OUTRO */}
            {scene === 3 && (
                <div className="h-screen flex flex-col items-center justify-center animate-fadeIn text-center">
                    <div className="mb-12 relative">
                        <div className="absolute inset-0 bg-yellow-400 blur-3xl opacity-20"></div>
                        <Crown size={100} className="text-yellow-400 relative z-10" />
                    </div>

                    <h2 className="text-7xl font-black text-white mb-8 leading-tight">
                        UNLEASH YOUR<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500">VIRAL POTENTIAL</span>
                    </h2>

                    <div className="bg-white text-black text-3xl font-bold px-12 py-6 rounded-full shadow-2xl shadow-white/20 animate-pulse">
                        TubeRocket.com
                    </div>

                    <button
                        onClick={() => setScene(0)}
                        className="absolute bottom-8 text-slate-600 text-sm hover:text-white transition-colors"
                    >
                        Replay Trailer
                    </button>
                </div>
            )}

            {/* Progress Bar for Recorder */}
            <div className="fixed bottom-0 left-0 h-1 bg-gradient-to-r from-yellow-400 to-purple-600 transition-all duration-300 ease-linear z-50"
                style={{ width: `${((scene + 1) / 4) * 100}%` }}></div>
        </div>
    );
}
