import React, { useState, useEffect } from "react";
import { Volume2, Pause, Play, Square, Gauge, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ttsEngine, ArticleForTTS, TTSState } from "@/lib/ttsEngine";

export type { ArticleForTTS };

/**
 * Backward compatibility wrapper for getReadableArticleText
 */
export function getReadableArticleText(article: ArticleForTTS): string {
  return ttsEngine.cleanArticleText(article);
}

interface ArticleTextToSpeechProps {
  article: ArticleForTTS;
  className?: string;
}

export function ArticleTextToSpeech({ article, className = "" }: ArticleTextToSpeechProps) {
  const [mounted, setMounted] = useState(false);
  const [ttsState, setTtsState] = useState<TTSState>(() => ttsEngine.getState());
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Subscribe to singleton TTS engine
  useEffect(() => {
    setMounted(true);
    const unsubscribe = ttsEngine.subscribe((nextState) => {
      setTtsState(nextState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Stop playback when navigating to a different article
  const currentArticleKey = article?.id || article?.slug || article?.title;
  useEffect(() => {
    return () => {
      // Only stop if this specific article was the one playing
      if (ttsEngine.getState().activeArticleId === currentArticleKey) {
        ttsEngine.stop();
      }
    };
  }, [currentArticleKey]);

  // Handle client-side support check safely
  const isSupported = mounted ? ttsState.isSupported : true;

  const isActive = ttsState.activeArticleId === currentArticleKey;
  const isPlaying = isActive && ttsState.isPlaying;
  const isPaused = isActive && ttsState.isPaused;
  const currentRate = ttsState.rate;

  const handlePlayClick = () => {
    if (!mounted || !article) return;
    ttsEngine.play(article);
  };

  const handlePauseClick = () => {
    ttsEngine.pause();
  };

  const handleResumeClick = () => {
    ttsEngine.resume();
  };

  const handleStopClick = () => {
    ttsEngine.stop();
  };

  const handleRateChange = (newRate: number) => {
    ttsEngine.setRate(newRate);
    setShowSpeedMenu(false);
  };

  // If client has finished mounting and browser genuinely does not support Web Speech
  if (mounted && !isSupported) {
    return null;
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 shadow-xs transition-all ${className}`}
    >
      {!isPlaying ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlayClick}
          className="h-7 px-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1.5 transition-colors cursor-pointer"
          aria-label="खबर सुनें"
          title="खबर सुनें (Hindi Text to Speech)"
        >
          <Volume2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400 animate-pulse" />
          <span>खबर सुनें</span>
        </Button>
      ) : (
        <>
          {/* Pause / Resume Button */}
          {isPaused ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResumeClick}
              className="h-7 px-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-1 transition-colors cursor-pointer"
              aria-label="जारी रखें"
              title="जारी रखें (Resume Reading)"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>जारी रखें</span>
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePauseClick}
              className="h-7 px-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-1 transition-colors cursor-pointer"
              aria-label="रोकें"
              title="रोकें (Pause Reading)"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>रोकें</span>
            </Button>
          )}

          {/* Animated Audio Equalizer Wave Indicator */}
          <div
            className="flex items-center gap-0.5 px-1 py-1"
            title={isPaused ? "रुक गया है" : "पढ़ा जा रहा है..."}
          >
            <span
              className={`w-0.5 bg-red-600 rounded-full transition-all duration-300 ${
                isPaused ? "h-1.5" : "h-3 animate-pulse"
              }`}
            />
            <span
              className={`w-0.5 bg-red-600 rounded-full transition-all duration-200 ${
                isPaused ? "h-2" : "h-4 animate-bounce"
              }`}
            />
            <span
              className={`w-0.5 bg-red-600 rounded-full transition-all duration-300 ${
                isPaused ? "h-1" : "h-2.5 animate-pulse"
              }`}
            />
          </div>

          {/* Progress Indicator (e.g. 2/8) */}
          {ttsState.totalChunks > 1 && (
            <span
              className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 tabular-nums px-1"
              title={`भाग ${ttsState.currentChunk} / ${ttsState.totalChunks}`}
            >
              {ttsState.currentChunk}/{ttsState.totalChunks}
            </span>
          )}

          {/* Stop Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleStopClick}
            className="h-7 px-2 text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:text-red-600 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 flex items-center gap-1 transition-colors cursor-pointer"
            aria-label="बंद करें"
            title="बंद करें (Stop Reading)"
          >
            <Square className="h-3 w-3 fill-current" />
            <span className="hidden sm:inline">बंद करें</span>
          </Button>

          {/* Speed Selector Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="h-7 px-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-0.5 cursor-pointer"
              title="गति बदलें (Speech Rate)"
            >
              <Gauge className="h-3 w-3" />
              <span>{currentRate}x</span>
            </Button>

            {showSpeedMenu && (
              <div className="absolute right-0 top-full mt-1 z-30 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg p-1 flex flex-col gap-0.5 min-w-[70px]">
                {[0.75, 1, 1.25, 1.5].map((speed) => (
                  <button
                    key={speed}
                    type="button"
                    onClick={() => handleRateChange(speed)}
                    className={`text-left text-[11px] px-2 py-1 rounded-xs font-medium transition-colors cursor-pointer ${
                      currentRate === speed
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

      {/* Error notification if speech engine encounters an issue */}
      {ttsState.error && isActive && (
        <span
          className="text-red-600 dark:text-red-400 inline-flex items-center gap-1 text-[10px] pl-1"
          title={ttsState.error}
        >
          <AlertCircle className="h-3 w-3 shrink-0" />
        </span>
      )}
    </div>
  );
}
