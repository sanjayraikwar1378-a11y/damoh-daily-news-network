import React, { useState, useEffect, useRef } from "react";
import { Volume2, Pause, Play, Square, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ArticleForTTS {
  title: string;
  excerpt?: string;
  content: string;
}

export function getReadableArticleText(article: ArticleForTTS): string {
  if (!article) return "";

  const titleText = article.title ? article.title.trim() : "";
  const cleanExcerpt = article.excerpt
    ? article.excerpt.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";
  const cleanContent = article.content
    ? article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    : "";

  const parts: string[] = [];
  if (titleText) parts.push(titleText);
  if (cleanExcerpt && !cleanContent.startsWith(cleanExcerpt)) {
    parts.push(cleanExcerpt);
  }
  if (cleanContent) parts.push(cleanContent);

  return parts.join(". ");
}

interface ArticleTextToSpeechProps {
  article: ArticleForTTS;
}

export function ArticleTextToSpeech({ article }: ArticleTextToSpeechProps) {
  // Safe check for Web Speech API availability
  const isSupported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [rate, setRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech when navigating or unmounting
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
    };
  }, [article.title]);

  if (!isSupported) {
    return null;
  }

  const findHindiVoice = (): SpeechSynthesisVoice | null => {
    try {
      const voices = window.speechSynthesis.getVoices();
      if (!voices || voices.length === 0) return null;

      // First priority: Exact or prefix match for 'hi'
      const hiVoice = voices.find(v => v.lang && (v.lang.toLowerCase().startsWith("hi") || v.lang.toLowerCase().includes("hindi")));
      if (hiVoice) return hiVoice;

      // Second priority: Any voice matching 'hi-IN'
      return voices.find(v => v.lang && v.lang.toLowerCase().includes("hi-in")) || null;
    } catch {
      return null;
    }
  };

  const handleStartSpeaking = (customRate?: number) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel(); // Stop any existing speech

      const textToRead = getReadableArticleText(article);
      if (!textToRead) return;

      const utterance = new SpeechSynthesisUtterance(textToRead);
      utterance.lang = "hi-IN";
      utterance.rate = customRate ?? rate;

      const voice = findHindiVoice();
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = () => {
        setIsPlaying(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      utterance.onerror = (e) => {
        // Handle normal cancellation errors gracefully
        if (e.error !== "interrupted" && e.error !== "canceled") {
          console.warn("SpeechSynthesis error:", e.error);
        }
        setIsPlaying(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      setIsPlaying(true);
      setIsPaused(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Failed to start SpeechSynthesis:", err);
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handleTogglePlayPause = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (!isPlaying) {
      handleStartSpeaking();
      return;
    }

    if (isPaused) {
      try {
        window.speechSynthesis.resume();
        setIsPaused(false);
      } catch {
        handleStartSpeaking();
      }
    } else {
      try {
        window.speechSynthesis.pause();
        setIsPaused(true);
      } catch {
        handleStop();
      }
    }
  };

  const handleStop = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setIsPlaying(false);
    setIsPaused(false);
    utteranceRef.current = null;
  };

  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    setShowSpeedMenu(false);
    if (isPlaying) {
      handleStartSpeaking(newRate);
    }
  };

  return (
    <div className="inline-flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-xs">
      {!isPlaying ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStartSpeaking()}
          className="h-7 px-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-colors"
          aria-label="खबर सुनें"
          title="खबर सुनें (Text to Speech)"
        >
          <Volume2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400 animate-pulse" />
          <span>खबर सुनें</span>
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleTogglePlayPause}
            className="h-7 px-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1 transition-colors"
            aria-label={isPaused ? "जारी रखें" : "रोकें"}
            title={isPaused ? "जारी रखें (Resume)" : "रोकें (Pause)"}
          >
            {isPaused ? (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>जारी रखें</span>
              </>
            ) : (
              <>
                <Pause className="h-3.5 w-3.5 fill-current" />
                <span>रोकें</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleStop}
            className="h-7 px-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-red-600 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 flex items-center gap-1 transition-colors"
            aria-label="बंद करें"
            title="बंद करें (Stop)"
          >
            <Square className="h-3 w-3 fill-current" />
            <span className="hidden sm:inline">बंद करें</span>
          </Button>

          {/* Speed Control Selector */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="h-7 px-1.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 flex items-center gap-0.5"
              title="गति बदलें (Speed)"
            >
              <Gauge className="h-3 w-3" />
              <span>{rate}x</span>
            </Button>

            {showSpeedMenu && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg p-1 flex flex-col gap-0.5 min-w-[65px]">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => handleRateChange(speed)}
                    className={`text-left text-[11px] px-2 py-1 rounded-xs font-medium transition-colors ${
                      rate === speed
                        ? "bg-red-600 text-white font-bold"
                        : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
