import { WifiOff, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FirestoreErrorBannerProps {
  onRetry: () => void;
  title?: string;
  message?: string;
}

export function FirestoreErrorBanner({ onRetry, title, message }: FirestoreErrorBannerProps) {
  return (
    <div className="container mx-auto px-4 py-16 text-center max-w-md space-y-4">
      <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-full w-16 h-16 mx-auto flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-sm">
        <WifiOff className="h-8 w-8" />
      </div>
      <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
        {title || "समाचार लोड करने में समस्या"}
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
        {message || "नेटवर्क कनेक्शन या सर्वर सिंक्रनाइज़ेशन में समस्या के कारण समाचार लोड नहीं हो सके। कृपया अपना इंटरनेट कनेक्शन जांचें और पुनः प्रयास करें।"}
      </p>
      <Button 
        onClick={onRetry}
        className="bg-red-600 hover:bg-red-700 text-white font-bold text-sm inline-flex items-center gap-2 mt-2 px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
      >
        <RotateCw className="h-4 w-4" /> पुनः प्रयास करें (Retry)
      </Button>
    </div>
  )
}
