import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Music, 
  Send, 
  Sparkles, 
  History, 
  Play, 
  Pause,
  ExternalLink, 
  Trash2, 
  Heart,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Volume2
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { analyzeMood, type MoodAnalysis, type Song } from './services/gemini';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SavedVibe extends MoodAnalysis {
  id: string;
  timestamp: number;
  input: string;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: any) => void;
  }
}

export default function App() {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentVibe, setCurrentVibe] = useState<MoodAnalysis | null>(null);
  const [history, setHistory] = useState<SavedVibe[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [preference, setPreference] = useState<'english' | 'hindi' | 'bollywood' | 'mainstream'>('mainstream');
  const [selectedTrack, setSelectedTrack] = useState<Song | null>(null);
  const [embedController, setEmbedController] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Load Spotify Iframe API
    const script = document.createElement('script');
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
      const element = document.getElementById('spotify-player-container');
      if (element) {
        const options = {
          width: '100%',
          height: '100%',
          uri: '' // Will be set later
        };
        const callback = (EmbedController: any) => {
          setEmbedController(EmbedController);
          EmbedController.addListener('playback_update', (e: any) => {
            setIsPlaying(!e.data.isPaused);
          });
        };
        IFrameAPI.createController(element, options, callback);
      }
    };

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (embedController && selectedTrack) {
      const uri = selectedTrack.spotifyTrackId && selectedTrack.spotifyTrackId.length > 5
        ? `spotify:track:${selectedTrack.spotifyTrackId}`
        : `spotify:search:${selectedTrack.spotifyQuery}`;
      embedController.loadUri(uri);
      embedController.play();
    }
  }, [selectedTrack, embedController]);

  const togglePlay = () => {
    if (embedController) {
      embedController.togglePlay();
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('vibeshift_history');
    if (saved) {
      setHistory(JSON.parse(saved));
    }
  }, []);

  const saveToHistory = (vibe: MoodAnalysis, originalInput: string) => {
    const newEntry: SavedVibe = {
      ...vibe,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      input: originalInput
    };
    const updated = [newEntry, ...history].slice(0, 20);
    setHistory(updated);
    localStorage.setItem('vibeshift_history', JSON.stringify(updated));
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setSelectedTrack(null);
    try {
      const result = await analyzeMood(input, preference);
      setCurrentVibe(result);
      saveToHistory(result, input);
      setInput('');
    } catch (error) {
      console.error('Failed to analyze mood:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter(item => item.id !== id);
    setHistory(updated);
    localStorage.setItem('vibeshift_history', JSON.stringify(updated));
  };

  // Spotify Embed URL Generator (Most reliable for on-page playback)
  const getPlayerUrl = (track: Song) => {
    if (track.spotifyTrackId && track.spotifyTrackId.length > 5) {
      return `https://open.spotify.com/embed/track/${track.spotifyTrackId}?utm_source=generator&theme=0`;
    }
    // Fallback to search if ID is missing
    return `https://open.spotify.com/embed/search/${encodeURIComponent(track.spotifyQuery)}`;
  };

  const handleNext = () => {
    if (!currentVibe || !selectedTrack) return;
    const currentIndex = currentVibe.playlist.findIndex(s => s.title === selectedTrack.title);
    const nextIndex = (currentIndex + 1) % currentVibe.playlist.length;
    setSelectedTrack(currentVibe.playlist[nextIndex]);
  };

  const handlePrevious = () => {
    if (!currentVibe || !selectedTrack) return;
    const currentIndex = currentVibe.playlist.findIndex(s => s.title === selectedTrack.title);
    const prevIndex = (currentIndex - 1 + currentVibe.playlist.length) % currentVibe.playlist.length;
    setSelectedTrack(currentVibe.playlist[prevIndex]);
  };

  const openSpotify = (track: Song, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.open(`https://open.spotify.com/search/${encodeURIComponent(track.spotifyQuery)}`, '_blank');
  };

  return (
    <div 
      className="min-h-screen transition-all duration-1000 ease-in-out overflow-x-hidden selection:bg-white selection:text-black"
      style={{ 
        backgroundColor: currentVibe?.colors.primary || '#09090b',
        backgroundImage: currentVibe 
          ? `radial-gradient(circle at 50% 50%, ${currentVibe.colors.secondary}66 0%, transparent 70%), 
             linear-gradient(to bottom, ${currentVibe.colors.primary}, ${currentVibe.colors.secondary})`
          : 'linear-gradient(to bottom, #09090b, #18181b)'
      }}
    >
      <div className="noise-bg" />

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          animate={{ 
            scale: [1, 1.6, 1.2, 1.8, 1],
            rotate: [0, 90, 180, 270, 360],
            x: [0, 100, -50, 150, 0],
            y: [0, -50, 100, -150, 0],
            borderRadius: ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 50% 60% 40% 60%", "40% 60% 70% 30% / 40% 50% 60% 50%"]
          }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[120%] h-[120%] blur-[150px] opacity-30 transition-colors duration-2000"
          style={{ backgroundColor: currentVibe?.colors.accent || '#10b981' }}
        />
        <motion.div 
          animate={{ 
            scale: [1.8, 1.2, 1.6, 1, 1.8],
            rotate: [360, 270, 180, 90, 0],
            x: [0, -150, 50, -100, 0],
            y: [0, 150, -100, 50, 0],
            borderRadius: ["60% 40% 30% 70% / 50% 60% 40% 60%", "40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 50% 60% 40% 60%"]
          }}
          transition={{ duration: 45, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -right-[10%] w-[120%] h-[120%] blur-[150px] opacity-30 transition-colors duration-2000"
          style={{ backgroundColor: currentVibe?.colors.secondary || '#6366f1' }}
        />
        <motion.div 
          animate={{ 
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 lg:py-12">
        {/* Navigation */}
        <nav className="flex items-center justify-between mb-16">
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-6"
          >
            <div className="w-14 h-14 rounded-3xl bg-white text-black flex items-center justify-center shadow-2xl shadow-white/20 -rotate-6 hover:rotate-0 transition-all duration-500 cursor-pointer group">
              <Music className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">VibeShift</h1>
              <p className="text-[10px] tracking-[0.5em] uppercase opacity-50 font-black mt-1">Neural Audio Synthesis</p>
            </div>
          </motion.div>
          
          <div className="flex items-center gap-6">
            <div className="hidden lg:flex bg-black/40 backdrop-blur-2xl p-1.5 rounded-full border border-white/10 shadow-2xl">
              {(['english', 'hindi', 'bollywood', 'mainstream'] as const).map((opt) => (
                <button
                  key={opt}
                  onClick={() => setPreference(opt)}
                  className={cn(
                    "px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                    preference === opt ? "bg-white text-black shadow-xl scale-105" : "text-zinc-400 hover:text-white"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className="w-14 h-14 rounded-full glass flex items-center justify-center hover:scale-110 transition-all relative group shadow-2xl"
            >
              <History className="w-7 h-7 group-hover:rotate-45 transition-transform" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center border-2 border-zinc-900">
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </nav>

        <main className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          {/* Left Column: Input & Controls */}
          <div className="lg:col-span-4 space-y-12">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h2 className="text-7xl font-black tracking-tighter leading-[0.85] uppercase">
                  Sonic <br /> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/20 italic">Alchemy</span>
                </h2>
                <p className="text-zinc-400 text-xl font-medium leading-relaxed">
                  Transmute your emotions into high-fidelity soundscapes.
                </p>
              </div>

              <div className="lg:hidden flex flex-wrap gap-2 bg-black/40 backdrop-blur-2xl p-2 rounded-2xl border border-white/10">
                {(['english', 'hindi', 'bollywood', 'mainstream'] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setPreference(opt)}
                    className={cn(
                      "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      preference === opt ? "bg-white text-black" : "text-zinc-400"
                    )}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAnalyze} className="relative group">
                <div className="absolute -inset-2 bg-gradient-to-r from-white/30 to-transparent rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="What's the current state of your soul?"
                    className="w-full bg-black/60 backdrop-blur-3xl border-2 border-white/10 rounded-[2.5rem] p-10 pr-24 min-h-[250px] focus:outline-none focus:border-white/40 transition-all text-2xl font-bold placeholder:text-zinc-800 shadow-[0_0_100px_rgba(0,0,0,0.5)]"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isAnalyzing}
                    className={cn(
                      "absolute bottom-8 right-8 w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-2xl",
                      input.trim() && !isAnalyzing 
                        ? "bg-white text-black hover:scale-110 active:scale-90" 
                        : "bg-white/5 text-zinc-800 cursor-not-allowed"
                    )}
                  >
                    {isAnalyzing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Send className="w-8 h-8" />}
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap gap-4">
                {['Cyberpunk Neon', 'Deep Focus', 'Melancholic Rain', 'Euphoric High', 'Vintage Soul'].map((mood) => (
                  <button
                    key={mood}
                    onClick={() => setInput(mood)}
                    className="px-8 py-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white hover:text-black text-[10px] font-black uppercase tracking-[0.2em] transition-all hover:-translate-y-2 shadow-lg"
                  >
                    {mood}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Column: Immersive Results */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!currentVibe && !isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20 glass rounded-[4rem] border-dashed border-4 border-white/5 relative overflow-hidden"
                >
                  <div className="aura-pulse bg-white/10" />
                  <div className="relative z-10">
                    <motion.div 
                      animate={{ 
                        rotate: 360,
                        scale: [1, 1.05, 1],
                      }}
                      transition={{ 
                        rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                        scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                      }}
                      className="w-48 h-48 vinyl-record mb-12 opacity-10 mx-auto" 
                    />
                    <h3 className="text-4xl font-black uppercase tracking-[0.5em] opacity-20 italic">Awaiting Frequency</h3>
                  </div>
                </motion.div>
              )}

              {isAnalyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[600px] flex flex-col items-center justify-center text-center p-20 glass rounded-[4rem] relative overflow-hidden"
                >
                  <div className="aura-pulse" style={{ backgroundColor: 'white' }} />
                  <div className="relative z-10">
                    <div className="relative mb-16">
                      <motion.div 
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.1, 1],
                          filter: ["blur(0px)", "blur(2px)", "blur(0px)"]
                        }}
                        transition={{ 
                          rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                          filter: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="w-64 h-64 vinyl-record shadow-[0_0_100px_rgba(255,255,255,0.3)]" 
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 bg-white rounded-full animate-ping" />
                      </div>
                    </div>
                    <h3 className="text-5xl font-black uppercase tracking-tighter italic animate-pulse">Syncing Reality...</h3>
                    <p className="text-zinc-500 mt-4 font-mono text-sm uppercase tracking-[0.5em]">Neural pathways connecting</p>
                  </div>
                </motion.div>
              )}

              {currentVibe && !isAnalyzing && (
                <motion.div
                  key={currentVibe.mood}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="space-y-12"
                >
                  {/* Immersive Mood Takeover */}
                  <div className="relative overflow-hidden glass-dark rounded-[4rem] p-12 lg:p-16 border-t-[12px] shadow-[0_50px_100px_rgba(0,0,0,0.5)]" style={{ borderColor: currentVibe.colors.accent }}>
                    <div className="absolute top-0 right-0 p-12 hidden lg:block">
                      <motion.div 
                        animate={{ 
                          rotate: 360,
                          scale: isPlaying ? [1, 1.02, 1] : 1,
                          y: isPlaying ? [0, -5, 0] : 0
                        }}
                        transition={{ 
                          rotate: { duration: isPlaying ? 5 : 20, repeat: Infinity, ease: "linear" },
                          scale: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
                          y: { duration: 0.5, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="w-48 h-48 vinyl-record" 
                        style={{ boxShadow: `0 0 60px ${currentVibe.colors.accent}66` }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 rounded-full border-4 border-zinc-900" style={{ backgroundColor: currentVibe.colors.accent }} />
                        </div>
                      </motion.div>
                    </div>

                    <div className="relative z-10 max-w-2xl">
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="flex items-center gap-4 mb-8"
                      >
                        <span className="px-6 py-2 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-[0.3em]">Mood Analysis Complete</span>
                        <div className="flex gap-2">
                          {[1,2,3,4,5].map(i => <motion.div key={i} animate={{ scale: [1, 1.5, 1] }} transition={{ delay: i * 0.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-white/40" />)}
                        </div>
                      </motion.div>
                      
                      <h3 className="text-[10rem] font-black tracking-tighter uppercase italic leading-[0.8] mb-10 text-glow" style={{ color: currentVibe.colors.accent }}>
                        {currentVibe.mood}
                      </h3>
                      
                      <p className="text-3xl text-zinc-200 leading-tight font-black italic border-l-8 pl-10 py-2" style={{ borderColor: currentVibe.colors.accent }}>
                        "{currentVibe.description}"
                      </p>
                    </div>
                  </div>

                  {/* Player Section */}
                  <AnimatePresence>
                    {selectedTrack && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="spotify-embed-container"
                      >
                        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-widest">Now Playing</span>
                              <span className="text-sm font-black uppercase tracking-tighter">{selectedTrack.title}</span>
                            </div>
                          </div>
                          
                          {/* Player Controls */}
                          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                            <button onClick={handlePrevious} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                              <ChevronLeft className="w-6 h-6" />
                            </button>
                            <button onClick={togglePlay} className="p-3 bg-white text-black rounded-xl hover:scale-105 transition-transform">
                              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
                            </button>
                            <button onClick={handleNext} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                              <ChevronRight className="w-6 h-6" />
                            </button>
                          </div>

                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${selectedTrack.artist} ${selectedTrack.title}`)}`, '_blank')}
                              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500 text-white text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                            >
                              Watch on YouTube
                            </button>
                            <button 
                              onClick={(e) => openSpotify(selectedTrack, e)}
                              className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                            >
                              Open in Spotify
                            </button>
                            <button onClick={() => setSelectedTrack(null)} className="text-zinc-500 hover:text-white transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="aspect-[16/6] w-full bg-black relative" id="spotify-player-container">
                          {!embedController && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Bento Tracks Grid */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-8">
                      <h4 className="text-xs font-black uppercase tracking-[0.5em] text-zinc-500">The Sonic Sequence</h4>
                      <div className="h-px flex-1 mx-10 bg-white/10" />
                      <Sparkles className="w-5 h-5 text-white/40" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentVibe.playlist.map((song, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                          transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 17,
                            delay: idx * 0.1 
                          }}
                          onClick={() => setSelectedTrack(song)}
                          className={cn(
                            "group relative glass-dark p-8 rounded-[3rem] transition-all duration-500 cursor-pointer overflow-hidden border-2",
                            selectedTrack?.title === song.title 
                              ? "border-white bg-white text-black shadow-[0_0_50px_rgba(255,255,255,0.3)]" 
                              : "border-transparent hover:border-white/20 hover:bg-white/5 hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]"
                          )}
                        >
                          {/* Hover Aura */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                          
                          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
                            <div className="flex justify-between items-start">
                              <span className={cn(
                                "text-4xl font-black italic transition-all",
                                selectedTrack?.title === song.title ? "text-black/20" : "text-white/10 group-hover:text-white/40"
                              )}>
                                0{idx + 1}
                              </span>
                              <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                                selectedTrack?.title === song.title ? "bg-black text-white" : "bg-white/5 group-hover:bg-white group-hover:text-black"
                              )}>
                                <Play className={cn("w-6 h-6", selectedTrack?.title === song.title && "fill-current")} />
                              </div>
                            </div>

                            <div>
                              <h5 className="text-2xl font-black uppercase tracking-tighter leading-none mb-2">{song.title}</h5>
                              <p className={cn(
                                "text-xs font-black uppercase tracking-widest",
                                selectedTrack?.title === song.title ? "text-black/60" : "text-zinc-500"
                              )}>{song.artist}</p>
                            </div>

                            <p className={cn(
                              "text-[10px] font-bold uppercase tracking-wider leading-relaxed",
                              selectedTrack?.title === song.title ? "text-black/80" : "text-zinc-600 group-hover:text-zinc-400"
                            )}>
                              {song.reason}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        <footer className="mt-48 py-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-2xl">
              <Music className="w-6 h-6 text-black" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.5em]">VibeShift v3.1</span>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.6em] text-zinc-700 text-center">
            Neural Resonance Engine • Optimized for Human Emotion • {new Date().getFullYear()}
          </p>
          <div className="flex gap-10 opacity-20">
            <Heart className="w-6 h-6" />
            <Sparkles className="w-6 h-6" />
            <Music className="w-6 h-6" />
          </div>
        </footer>
      </div>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-3xl z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-zinc-950 border-l border-white/10 z-50 p-16 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-20">
                <h2 className="text-6xl font-black uppercase tracking-tighter italic">Archive</h2>
                <button onClick={() => setShowHistory(false)} className="w-16 h-16 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform shadow-2xl">
                  <ChevronRight className="w-8 h-8" />
                </button>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-48 opacity-10">
                  <History className="w-32 h-32 mx-auto mb-10" />
                  <p className="text-xl font-black uppercase tracking-[0.5em]">No records found</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {history.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      onClick={() => {
                        setCurrentVibe(item);
                        setShowHistory(false);
                      }}
                      className="group relative glass p-10 rounded-[4rem] hover:bg-white transition-all duration-500 cursor-pointer overflow-hidden border-2 border-transparent hover:border-white shadow-2xl"
                    >
                      <div className="flex justify-between items-start mb-6">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 group-hover:text-zinc-400 transition-colors">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                        <button 
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          className="p-3 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-6 h-6" />
                        </button>
                      </div>
                      <h4 className="text-6xl font-black uppercase italic tracking-tighter group-hover:text-black transition-colors leading-none mb-4" style={{ color: item.colors.accent }}>
                        {item.mood}
                      </h4>
                      <p className="text-sm font-bold text-zinc-500 group-hover:text-zinc-700 line-clamp-2 uppercase tracking-tight">
                        {item.input}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
