/**
 * High-Performance, Crash-Proof Text-to-Speech Engine for Hindi Articles
 * Optimized for Chrome Android, Mobile Safari, Desktop Chrome, and Vercel/SSR environments.
 * 
 * Solves:
 * 1. Web Speech API garbage collection bug (Chromium Issue 264305)
 * 2. Chrome cancel() vs speak() race condition & interrupted errors
 * 3. Chrome 15-second stall timeout bug via keep-alive pings
 * 4. Android Chrome TTS 250-character buffer limit via natural sentence chunking
 * 5. Asynchronous getVoices() initialization via voiceschanged listener
 * 6. Dual-button desynchronization via unified singleton state
 * 7. HTML entity corruption and tag contamination in speech text
 */

export interface ArticleForTTS {
  id?: string;
  slug?: string;
  title: string;
  excerpt?: string;
  content: string;
}

export interface TTSState {
  isSupported: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  rate: number;
  currentChunk: number;
  totalChunks: number;
  activeArticleId: string | null;
  selectedVoiceName: string | null;
  error: string | null;
}

type TTSListener = (state: TTSState) => void;

class TTSEngine {
  private listeners: Set<TTSListener> = new Set();
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;
  private chunks: string[] = [];
  private currentChunkIndex: number = 0;
  private rate: number = 1;
  private activeArticleId: string | null = null;
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private keepAliveTimer: any = null;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;
  private lastError: string | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      this.initVoices();
    }
  }

  public isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "speechSynthesis" in window &&
      "SpeechSynthesisUtterance" in window
    );
  }

  private initVoices() {
    if (!this.isSupported()) return;

    const loadVoices = () => {
      try {
        const list = window.speechSynthesis.getVoices();
        if (list && list.length > 0) {
          this.voices = list;
          this.voicesLoaded = true;
          this.selectedVoice = this.pickBestHindiVoice(list);
          this.notify();
        }
      } catch (err) {
        console.warn("TTS: Error reading speech voices:", err);
      }
    };

    loadVoices();

    try {
      if (typeof window.speechSynthesis.addEventListener === "function") {
        window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      }
      window.speechSynthesis.onvoiceschanged = loadVoices;
    } catch {}
  }

  private pickBestHindiVoice(voiceList: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
    if (!voiceList || voiceList.length === 0) return null;

    // Priority 1: Exact Hindi language match (hi-IN, hi_IN)
    const exactHindi = voiceList.find(
      (v) => v.lang && (v.lang.toLowerCase() === "hi-in" || v.lang.toLowerCase() === "hi_in")
    );
    if (exactHindi) return exactHindi;

    // Priority 2: Any voice whose lang starts with 'hi'
    const prefixHindi = voiceList.find(
      (v) => v.lang && v.lang.toLowerCase().startsWith("hi")
    );
    if (prefixHindi) return prefixHindi;

    // Priority 3: Voice name contains Hindi or Devanagari
    const nameHindi = voiceList.find(
      (v) =>
        v.name &&
        (v.name.toLowerCase().includes("hindi") ||
          v.name.includes("हिन्दी") ||
          v.name.toLowerCase().includes("kalpana") ||
          v.name.toLowerCase().includes("hemant") ||
          v.name.toLowerCase().includes("lekha"))
    );
    if (nameHindi) return nameHindi;

    // Priority 4: Indian English voice with Indian phonetic rendering
    const indianEnglish = voiceList.find(
      (v) =>
        (v.lang && v.lang.toLowerCase() === "en-in") ||
        (v.name && v.name.toLowerCase().includes("india"))
    );
    if (indianEnglish) return indianEnglish;

    // Priority 5: Default system voice (will speak with lang="hi-IN" phoneme map)
    const defaultVoice = voiceList.find((v) => v.default);
    if (defaultVoice) return defaultVoice;

    return voiceList[0] || null;
  }

  public getState(): TTSState {
    return {
      isSupported: this.isSupported(),
      isPlaying: this.isPlaying,
      isPaused: this.isPaused,
      rate: this.rate,
      currentChunk: this.currentChunkIndex + 1,
      totalChunks: this.chunks.length,
      activeArticleId: this.activeArticleId,
      selectedVoiceName: this.selectedVoice ? this.selectedVoice.name : null,
      error: this.lastError,
    };
  }

  public subscribe(listener: TTSListener): () => void {
    this.listeners.add(listener);
    // Emit initial state immediately
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(state);
      } catch (err) {
        console.error("TTS subscriber error:", err);
      }
    });
  }

  /**
   * Cleans HTML markup, decodes entities, and produces natural Devanagari sentences
   */
  public cleanArticleText(article: ArticleForTTS): string {
    if (!article) return "";

    const cleanSnippet = (raw: string | undefined): string => {
      if (!raw) return "";
      let text = raw;

      // Strip HTML tags safely
      text = text.replace(/<[^>]+>/g, " ");

      // Decode common HTML entities
      const entities: Record<string, string> = {
        "&nbsp;": " ",
        "&amp;": " और ",
        "&quot;": '"',
        "&#39;": "'",
        "&apos;": "'",
        "&lt;": "<",
        "&gt;": ">",
        "&bull;": " ",
        "&middot;": " ",
        "&ndash;": "-",
        "&mdash;": "-",
        "&hellip;": "..."
      };
      text = text.replace(/&[a-z0-9#]+;/gi, (m) => entities[m.toLowerCase()] || " ");

      // Remove URLs
      text = text.replace(/https?:\/\/\S+/gi, "");

      // Remove zero-width characters
      text = text.replace(/[\u200B-\u200D\uFEFF]/g, "");

      // Normalize multiple whitespaces
      text = text.replace(/\s+/g, " ").trim();

      return text;
    };

    const titleText = cleanSnippet(article.title);
    const excerptText = cleanSnippet(article.excerpt);
    const contentText = cleanSnippet(article.content);

    const parts: string[] = [];

    if (titleText) {
      parts.push(titleText);
    }

    // Include excerpt only if it is not just the first sentence of content
    if (excerptText && !contentText.startsWith(excerptText)) {
      parts.push(excerptText);
    }

    if (contentText) {
      parts.push(contentText);
    }

    return parts.join("। ");
  }

  /**
   * Splits full text into natural Hindi speech chunks (100 - 160 chars).
   * Ensures mobile browsers (Chrome Android) never drop or truncate long texts.
   */
  public splitIntoChunks(fullText: string, maxLen = 160): string[] {
    if (!fullText) return [];

    // Helper to safely split any long string by whitespace word boundaries
    const splitByWords = (str: string, limit: number): string[] => {
      const words = str.split(/\s+/).filter(Boolean);
      const results: string[] = [];
      let current = "";
      for (const w of words) {
        if (!current) {
          current = w;
        } else if ((current + " " + w).length <= limit) {
          current += " " + w;
        } else {
          results.push(current);
          current = w;
        }
      }
      if (current) {
        results.push(current);
      }
      return results;
    };

    // Split on Hindi purna viram (।), period, exclamation, question mark, or newline
    const rawSentences = fullText
      .split(/[।\.!\?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const chunks: string[] = [];

    for (const sentence of rawSentences) {
      if (sentence.length <= maxLen) {
        chunks.push(sentence);
      } else {
        // Break long compound sentences by commas, semicolons, colons or dashes
        const clauses = sentence
          .split(/[,;:–—]+/)
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        for (const clause of clauses) {
          if (clause.length <= maxLen) {
            chunks.push(clause);
          } else {
            // If an individual clause still exceeds maxLen, break strictly on word boundaries
            const wordChunks = splitByWords(clause, maxLen);
            chunks.push(...wordChunks);
          }
        }
      }
    }

    // Filter out empty or punctuation-only chunks
    return chunks.filter((c) => c.replace(/[\s\-_.,।!?;:'"]+/g, "").length > 0);
  }

  /**
   * Start or toggle speech for an article
   */
  public play(article: ArticleForTTS, customRate?: number) {
    if (!this.isSupported()) {
      this.lastError = "आपके ब्राउज़र में आवाज़ (Text to Speech) समर्थित नहीं है।";
      this.notify();
      return;
    }

    const articleKey = article.id || article.slug || article.title;

    // If already playing this article and paused, resume it
    if (this.isPlaying && this.isPaused && this.activeArticleId === articleKey) {
      this.resume();
      return;
    }

    if (customRate) {
      this.rate = customRate;
    }

    const fullText = this.cleanArticleText(article);
    if (!fullText) {
      this.lastError = "खबर में पढ़ने योग्य सामग्री उपलब्ध नहीं है।";
      this.notify();
      return;
    }

    const chunks = this.splitIntoChunks(fullText);
    if (chunks.length === 0) {
      this.lastError = "सामग्री प्रोसेस नहीं हो सकी।";
      this.notify();
      return;
    }

    this.activeArticleId = articleKey;
    this.chunks = chunks;
    this.currentChunkIndex = 0;
    this.isPlaying = true;
    this.isPaused = false;
    this.lastError = null;

    // If voices were not loaded yet, refresh list
    if (this.voices.length === 0) {
      try {
        const vList = window.speechSynthesis.getVoices();
        if (vList && vList.length > 0) {
          this.voices = vList;
          this.selectedVoice = this.pickBestHindiVoice(vList);
        }
      } catch {}
    }

    // Chrome bugfix: Cancel any lingering previous speech
    this.safeCancel(() => {
      this.speakChunk(this.currentChunkIndex);
      this.startKeepAlive();
      this.notify();
    });
  }

  public pause() {
    if (!this.isSupported() || !this.isPlaying) return;

    try {
      window.speechSynthesis.pause();
      this.isPaused = true;
      this.stopKeepAlive();
      this.notify();
    } catch (err) {
      console.warn("TTS: Pause error:", err);
    }
  }

  public resume() {
    if (!this.isSupported() || !this.isPlaying) return;

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        // Some mobile browsers fail resume() - restart from current chunk index
        this.speakChunk(this.currentChunkIndex);
      }
      this.isPaused = false;
      this.startKeepAlive();
      this.notify();
    } catch (err) {
      console.warn("TTS: Resume error:", err);
      // Fallback: replay current chunk
      this.speakChunk(this.currentChunkIndex);
      this.isPaused = false;
      this.notify();
    }
  }

  public stop() {
    if (!this.isSupported()) return;

    this.stopKeepAlive();
    this.safeCancel();
    this.isPlaying = false;
    this.isPaused = false;
    this.activeArticleId = null;
    this.currentChunkIndex = 0;
    this.chunks = [];
    this.activeUtterance = null;
    if (typeof window !== "undefined") {
      (window as any).__TTS_ACTIVE_UTTERANCE__ = null;
    }
    this.notify();
  }

  public setRate(newRate: number) {
    this.rate = newRate;
    if (this.isPlaying && !this.isPaused) {
      // Re-speak current chunk with new rate
      this.safeCancel(() => {
        this.speakChunk(this.currentChunkIndex);
      });
    }
    this.notify();
  }

  /**
   * Safely cancels current synthesis and queues callback once queue is idle.
   * Prevents Chrome's synchronous cancel-then-speak crash.
   */
  private safeCancel(onDone?: () => void) {
    if (!this.isSupported()) {
      if (onDone) onDone();
      return;
    }

    try {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        window.speechSynthesis.cancel();
        // Give Chrome a short 30ms window to flush its internal cancel state
        setTimeout(() => {
          try {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
            }
          } catch {}
          if (onDone) onDone();
        }, 30);
      } else {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        if (onDone) onDone();
      }
    } catch {
      if (onDone) onDone();
    }
  }

  /**
   * Speaks a specific chunk by index
   */
  private speakChunk(index: number) {
    if (!this.isSupported() || !this.isPlaying || this.isPaused) return;

    if (index >= this.chunks.length) {
      // Completed reading the entire article!
      this.stop();
      return;
    }

    this.currentChunkIndex = index;
    const text = this.chunks[index];

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      utterance.rate = this.rate;

      // Select best Hindi voice
      if (!this.selectedVoice && this.voices.length > 0) {
        this.selectedVoice = this.pickBestHindiVoice(this.voices);
      }
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // CRUCIAL: Retain utterance globally to prevent V8 Garbage Collector from cutting off audio
      this.activeUtterance = utterance;
      if (typeof window !== "undefined") {
        (window as any).__TTS_ACTIVE_UTTERANCE__ = utterance;
        if (!(window as any).__TTS_UTTERANCE_POOL__) {
          (window as any).__TTS_UTTERANCE_POOL__ = [];
        }
        (window as any).__TTS_UTTERANCE_POOL__.push(utterance);
        if ((window as any).__TTS_UTTERANCE_POOL__.length > 10) {
          (window as any).__TTS_UTTERANCE_POOL__.shift();
        }
      }

      utterance.onend = () => {
        if (!this.isPlaying || this.isPaused) return;

        // Clean up reference to this utterance
        this.activeUtterance = null;

        // Advance to next chunk if available
        if (index + 1 < this.chunks.length) {
          this.currentChunkIndex = index + 1;
          this.notify();
          // Asynchronously trigger next chunk to allow Android Chrome audio pipeline to cleanly transition
          setTimeout(() => {
            if (this.isPlaying && !this.isPaused) {
              this.speakChunk(index + 1);
            }
          }, 40);
        } else {
          // Finished reading the entire article!
          this.stop();
        }
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        // "interrupted" or "canceled" are standard events when stop() or pause() is called
        if (event.error === "interrupted" || event.error === "canceled") {
          return;
        }
        console.warn(`TTS: Error speaking chunk ${index} (${event.error}):`, event);

        // Attempt recovery: move to next chunk instead of crashing the whole player
        if (this.isPlaying && !this.isPaused && index + 1 < this.chunks.length) {
          this.currentChunkIndex = index + 1;
          this.notify();
          setTimeout(() => {
            if (this.isPlaying && !this.isPaused) {
              this.speakChunk(index + 1);
            }
          }, 60);
        } else {
          this.lastError = "आवाज़ चलाने में त्रुटि हुई।";
          this.stop();
        }
      };

      // Unpause speech engine if browser was stuck in paused state
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("TTS: Speak error:", err);
      this.stop();
    }
  }

  /**
   * Watchdog timer to ensure speech engine does not freeze or stay stuck paused
   */
  private startKeepAlive() {
    this.stopKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      if (this.isSupported() && this.isPlaying && !this.isPaused) {
        try {
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch {}
      }
    }, 5000);
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }
}

// Export singleton instance
export const ttsEngine = new TTSEngine();
