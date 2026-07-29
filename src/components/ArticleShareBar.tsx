import React, { useState } from 'react';
import { Share2, Check, Copy, X, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';

interface ArticleShareBarProps {
  title: string;
  url?: string;
  imageUrl?: string;
  variant?: 'compact' | 'full'; // 'compact' for top action bar, 'full' for bottom of article
}

export const ArticleShareBar: React.FC<ArticleShareBarProps> = ({
  title,
  url: customUrl,
  imageUrl,
  variant = 'compact',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = customUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const handleWhatsAppShare = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n\n${shareUrl}`)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const isMobileDevice = () => {
    if (typeof window === 'undefined') return false;
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
      window.innerWidth < 768
    );
  };

  const handleShareClick = async () => {
    if (isMobileDevice() && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: shareUrl,
        });
        return;
      } catch (err) {
        // User cancelled or share failed -> fallback to opening custom modal
        if ((err as Error)?.name !== 'AbortError') {
          console.log('Native share failed or cancelled, falling back to popup', err);
        } else {
          return; // User intentionally cancelled native share sheet
        }
      }
    }
    setIsOpen(true);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePlatformShare = (platform: string) => {
    let target = '';
    const encodedTitle = encodeURIComponent(title);
    const encodedUrl = encodeURIComponent(shareUrl);

    switch (platform) {
      case 'whatsapp':
        target = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${title}\n\n${shareUrl}`)}`;
        break;
      case 'telegram':
        target = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'facebook':
        target = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        target = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        target = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      default:
        break;
    }

    if (target) {
      window.open(target, '_blank', 'noopener,noreferrer');
    }
  };

  const handleNativeSystemShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: title,
          url: shareUrl,
        });
        setIsOpen(false);
      } catch (err) {
        console.log('Native share error:', err);
      }
    }
  };

  return (
    <>
      {/* Social Sharing Section Buttons */}
      {variant === 'full' ? (
        <div className="my-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/90 dark:to-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-red-600" />
                इस खबर को शेयर करें (Share Article)
              </h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                सच्ची और सटीक खबरों को अपने मित्रों और व्हाट्सएप ग्रुप्स तक पहुंचाएं
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* 1. WhatsApp Button */}
              <Button
                onClick={handleWhatsAppShare}
                className="bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 border-0"
              >
                <WhatsAppIcon className="w-4 h-4 fill-current" />
                <span>व्हाट्सएप</span>
              </Button>

              {/* 2. Share Button */}
              <Button
                onClick={handleShareClick}
                className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-bold text-sm px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>शेयर करें</span>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Compact Variant for Metadata Bar */
        <div className="flex items-center gap-2">
          {/* 1. WhatsApp Button */}
          <Button
            onClick={handleWhatsAppShare}
            size="sm"
            className="bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1.5 border-0"
            title="Share on WhatsApp"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Button>

          {/* 2. Share Button */}
          <Button
            onClick={handleShareClick}
            size="sm"
            className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-sm hover:shadow transition-all flex items-center gap-1.5 active:scale-95"
            title="Share Options"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </Button>
        </div>
      )}

      {/* Modern Custom Share Modal / Bottom Sheet Popup */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content / Bottom Sheet */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden z-10 p-6 space-y-5"
            >
              {/* Drag handle for mobile visual indicator */}
              <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto sm:hidden -mt-2 mb-2" />

              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-red-600" />
                    खबर शेयर करें (Share Article)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    अपने पसंदीदा प्लेटफार्म पर शेयर करें
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Article Preview Card */}
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                {Boolean(imageUrl?.trim()) && (
                  <img
                    src={imageUrl || undefined}
                    alt={title}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-zinc-200 dark:bg-zinc-700"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white line-clamp-2 leading-snug">
                    {title}
                  </h4>
                  <span className="text-[10px] text-zinc-400 font-mono mt-1 block truncate">
                    {shareUrl}
                  </span>
                </div>
              </div>

              {/* Platform Share Options Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                {/* 1. WhatsApp */}
                <button
                  onClick={() => handlePlatformShare('whatsapp')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200/50 dark:border-emerald-800/50 transition-all group"
                >
                  <div className="w-11 h-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <WhatsAppIcon className="w-6 h-6 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-2">
                    WhatsApp
                  </span>
                </button>

                {/* 2. Telegram */}
                <button
                  onClick={() => handlePlatformShare('telegram')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200/50 dark:border-sky-800/50 transition-all group"
                >
                  <div className="w-11 h-11 rounded-full bg-[#229ED9] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <TelegramIcon className="w-6 h-6 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-2">
                    Telegram
                  </span>
                </button>

                {/* 3. Facebook */}
                <button
                  onClick={() => handlePlatformShare('facebook')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/50 dark:border-blue-800/50 transition-all group"
                >
                  <div className="w-11 h-11 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <FacebookIcon className="w-6 h-6 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-2">
                    Facebook
                  </span>
                </button>

                {/* 4. X / Twitter */}
                <button
                  onClick={() => handlePlatformShare('twitter')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700 transition-all group"
                >
                  <div className="w-11 h-11 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <XIcon className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-2">
                    X (Twitter)
                  </span>
                </button>

                {/* 5. LinkedIn */}
                <button
                  onClick={() => handlePlatformShare('linkedin')}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/50 dark:border-indigo-800/50 transition-all group"
                >
                  <div className="w-11 h-11 rounded-full bg-[#0A66C2] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                    <LinkedInIcon className="w-5 h-5 fill-current" />
                  </div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-2">
                    LinkedIn
                  </span>
                </button>

                {/* 6. Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 border border-zinc-200/80 dark:border-zinc-700 transition-all group"
                >
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform ${
                    copied ? 'bg-green-600 text-white' : 'bg-zinc-700 text-white'
                  }`}>
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 mt-2">
                    {copied ? 'Copied!' : 'Copy Link'}
                  </span>
                </button>
              </div>

              {/* Copy Link Input Bar */}
              <div className="pt-2">
                <div className="flex items-center gap-2 p-1.5 pl-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full text-xs font-mono bg-transparent text-zinc-600 dark:text-zinc-300 focus:outline-none truncate"
                  />
                  <Button
                    onClick={handleCopyLink}
                    size="sm"
                    className={`font-bold text-xs px-3 py-1.5 rounded-lg transition-all ${
                      copied
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-red-600 hover:bg-red-700 text-white'
                    }`}
                  >
                    {copied ? (
                      <span className="flex items-center gap-1">
                        <Check className="h-3.5 w-3.5" /> copied
                      </span>
                    ) : (
                      'Copy'
                    )}
                  </Button>
                </div>
              </div>

              {/* Native Web Share Option if available */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <div className="pt-1">
                  <Button
                    onClick={handleNativeSystemShare}
                    variant="outline"
                    className="w-full text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <ExternalLink className="h-4 w-4 text-red-600" />
                    <span>अन्य एप्स में खोलें (More Share Options)</span>
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

// SVG Icon Helpers for Brand Authenticity
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 001.333 4.993L2 22l5.233-1.237a9.98 9.98 0 004.779 1.217h.004c5.505 0 9.988-4.478 9.989-9.984 0-2.669-1.038-5.176-2.925-7.062A9.925 9.925 0 0012.012 2zm5.84 14.155c-.247.693-1.242 1.32-1.722 1.365-.48.046-1.107.215-3.641-.832-2.822-1.168-4.636-4.041-4.778-4.23-.14-.188-1.151-1.533-1.151-2.923 0-1.391.73-2.073.988-2.355.259-.283.565-.353.754-.353.188 0 .376.002.541.01.176.008.412-.067.644.49.236.557.8 1.953.87 2.095.07.142.118.307.024.495-.094.188-.142.306-.283.471-.141.165-.296.368-.423.495-.142.141-.29.296-.125.578.165.283.737 1.214 1.58 1.966 1.085.967 2.001 1.267 2.284 1.408.283.141.448.118.613-.071.165-.188.706-.824.894-1.107.188-.283.377-.235.636-.141.259.094 1.648.777 1.93 1.201.283.424.283.683.142.976z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}
