import React, { useState } from "react";
import { 
  auth, 
  googleProvider, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  getAdditionalUserInfo,
  deleteUser,
  signOut
} from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield, Lock, Mail, LogIn, AlertCircle, CheckCircle2 } from "lucide-react";

interface AdminLoginProps {
  initialError?: string | null;
}

export function AdminLogin({ initialError }: AdminLoginProps = {}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError || null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // Authenticate ONLY existing users with signInWithEmailAndPassword
      await signInWithEmailAndPassword(auth, email, password);
      setSuccessMsg("Authenticated successfully! Redirecting to CMS Admin...");
    } catch (err: any) {
      console.error("Firebase Login error:", err);
      if (
        err.code === "auth/user-not-found" || 
        err.code === "auth/wrong-password" || 
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid credentials. Registration is disabled; only existing pre-configured Firebase Admin accounts can log in.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Access to this account has been temporarily disabled. Please try again later.");
      } else {
        setError(err.message || "Authentication failed. Please verify your credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const additionalInfo = getAdditionalUserInfo(userCredential);

      // Deny access if this Google account is not pre-registered in Firebase Auth
      if (additionalInfo?.isNewUser) {
        try {
          // Immediately delete the auto-provisioned user record
          await deleteUser(userCredential.user);
        } catch (delErr) {
          console.warn("Could not delete unauthorized Google account:", delErr);
        }
        await signOut(auth);
        setError("Access Denied. Your Google account is not authorized.");
        return;
      }

      setSuccessMsg("Signed in with Google successfully!");
    } catch (err: any) {
      console.error("Google Auth error:", err);
      if (err.message && err.message.includes("Access Denied")) {
        setError(err.message);
      } else {
        setError(err.message || "Access Denied. Your Google account is not authorized.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <img 
            src="/logo.png" 
            alt="Damoh Daily News Network" 
            onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              if (!target.src.endsWith('/logo.png')) target.src = '/logo.png';
            }}
            className="h-16 sm:h-20 w-auto max-w-[260px] object-contain mb-1 drop-shadow-md" 
          />
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Firebase Security &amp; CMS Admin Portal
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-zinc-800 bg-zinc-900/90 text-zinc-100 shadow-2xl backdrop-blur-md">
          <CardHeader className="space-y-1 pb-4 border-b border-zinc-800/80">
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              <span>Admin Authentication</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                Firebase Auth
              </span>
            </CardTitle>
            <CardDescription className="text-xs text-zinc-400">
              Sign in with your pre-configured Firebase Admin credentials to access CMS management.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug">{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your admin email"
                    className="pl-9 bg-zinc-950 border-zinc-800 text-white focus:border-red-500 font-medium text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                  <Input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="pl-9 bg-zinc-950 border-zinc-800 text-white focus:border-red-500 font-medium text-xs"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider h-10 shadow-md transition-all gap-2"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In with Firebase</span>
                  </>
                )}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-zinc-900 px-2 text-zinc-500 font-bold tracking-wider">
                  Or continue with
                </span>
              </div>
            </div>

            <Button 
              type="button"
              variant="outline"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-200 font-semibold text-xs h-10 gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Google Single Sign-On</span>
            </Button>

            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
              <span className="text-zinc-500 text-[11px]">User registration disabled</span>
              <a 
                href="/" 
                className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
              >
                ← Back to Site
              </a>
            </div>

          </CardContent>
        </Card>

        <div className="text-center text-[10px] text-zinc-500 space-y-1">
          <p>Damoh Daily News Portal — Connected to Firebase Project <code className="text-amber-400 font-mono">damoh-daily-news</code></p>
          <p>Protected by Firestore Security Rules &amp; Cloudinary CDN</p>
        </div>

      </div>
    </div>
  );
}
