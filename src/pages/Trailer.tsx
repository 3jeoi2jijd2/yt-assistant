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

    // Scene timings - FASTER PACED
    useEffect(() => {
        // Scene 0: Intro (2s) - Fast cut
        const timer1 = setTimeout(() => setScene(1), 2000);

        // Scene 1: Dashboard/Trend Radar (3s) - Quick look
        const timer2 = setTimeout(() => setScene(2), 5000);

        // Scene 2: Competitor Spy Typing (4s) - High speed
        const timer3 = setTimeout(() => setScene(3), 9000);

        // Scene 3: Outro

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, []);

    // Typing effect for Scene 2 - FASTER TYPING
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
            }, 50); // Faster typing speed (50ms)
            return () => clearInterval(typing);
        } else {
            setTypedText('');
        }
    }, [scene]);

    // Render Scenes - Added z-[9999] to hide sidebar
    return (
        <div className="fixed inset-0 z-[9999] bg-slate-950 text-white overflow-hidden font-sans">
            {/* Global shapes for all pages - reused from App.tsx/index.css */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-400 rounded-full blur-[100px] opacity-20 animate-float-slow"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[100px] opacity-20 animate-float-delayed"></div>

            {/* SCENE 0: INTRO - High Energy Flash */}
            {scene === 0 && (
                <div className="flex flex-col items-center justify-center h-screen animate-in fade-in zoom-in duration-300">
                    <div className="transform scale-150 mb-8 p-8 bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 relative z-10">
                        <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-10 rounded-3xl"></div>
                        <Sparkles size={120} className="text-yellow-400" />
                    </div>
                    <h1 className="text-9xl font-black italic bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent mb-4 tracking-tighter">
                        TubeRocket
                    </h1>
                </div>
            )}

            {/* SCENE 1: TREND RADAR - Fast Cut */}
            {scene === 1 && (
                <div className="h-screen p-8 animate-in slide-in-from-bottom duration-500">
                    <div className="max-w-6xl mx-auto pt-10">
                        <h2 className="text-6xl font-black text-white mb-12 text-center">
                            <span className="bg-red-600 px-4 text-white">VIRAL</span> TRENDS DETECTED
                        </h2>

                        <div className="grid grid-cols-2 gap-8 transform scale-110">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-slate-900 border-2 border-red-500 p-8 rounded-3xl shadow-2xl shadow-red-500/20">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className="bg-red-500 text-white px-6 py-2 rounded-full text-xl font-black flex items-center gap-2 animate-pulse">
                                            <TrendingUp size={24} /> EXPLODING
                                        </span>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4">Minecraft Hardcore (100 Days)</h3>
                                    <div className="h-4 bg-slate-800 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* SCENE 2: COMPETITOR SPY - Quick Action */}
            {scene === 2 && (
                <div className="h-screen p-8 animate-in zoom-in duration-300">
                    <div className="max-w-4xl mx-auto pt-32 text-center">
                        <h2 className="text-7xl font-black text-white mb-12">STEAL THEIR STRATEGY</h2>

                        <div className="bg-white rounded-full p-6 flex items-center gap-6 shadow-2xl transform scale-125 border-4 border-purple-500">
                            <Search size={48} className="text-purple-600 ml-4" />
                            <div className="flex-1 text-6xl font-black text-slate-900 font-mono text-left">
                                {typedText}<span className="animate-blink text-purple-600">|</span>
                            </div>
                        </div>

                        {typedText === fullText && (
                            <div className="mt-20 transform scale-150 animate-in slide-in-from-bottom duration-300">
                                <div className="bg-green-500 text-white px-12 py-6 rounded-3xl text-4xl font-black shadow-xl shadow-green-500/40 inline-flex items-center gap-4">
                                    <Crown size={48} />
                                    STRATEGY UNLOCKED
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* SCENE 3: OUTRO */}
            {scene === 3 && (
                <div className="h-screen flex flex-col items-center justify-center animate-in fade-in duration-1000 bg-yellow-400 text-black">
                    <h2 className="text-8xl font-black mb-8 leading-tight tracking-tighter">
                        START GROWING<br />
                        <span className="text-white drop-shadow-lg">TODAY.</span>
                    </h2>

                    <div className="bg-black text-white text-5xl font-black px-16 py-8 rounded-full shadow-2xl animate-bounce">
                        TubeRocket.com
                    </div>
                </div>
            )}
        </div>
    );
}
