import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft,
  ShieldCheck,
  Radio
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateToRegister: () => void;
  onBackToLanding: () => void;
  initialMessage?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateToRegister,
  onBackToLanding,
  initialMessage = null,
}) => {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(initialMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Please enter your email address');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: email.trim(),
        password,
      });
      onSuccess();
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401 || err.status === 404) {
          setErrorMessage('Invalid email or password. Please verify your credentials.');
        } else if (err.message) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('Failed to sign in. Please try again later.');
        }
      } else {
        setErrorMessage('Network connection error. Please ensure backend service is running.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-full text-slate-100 flex flex-col justify-center items-center p-3.5 sm:p-6 overflow-y-auto select-none font-sans relative bg-[#030B16]">
      {/* Background High-Tech Grid & Restrained Ambient Cyan Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 geo-grid-bg opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[140px] pointer-events-none" />
      </div>

      {/* Decorative Technical HUD Telemetry Markings (Desktop/Tablet) */}
      <div className="absolute top-4 right-6 z-10 hidden md:flex items-center gap-2 text-[10px] font-mono text-[#8FA6BA] pointer-events-none">
        <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
        <span>NODE: GVS-AUTH-01 // TLS 1.3 SECURE</span>
      </div>
      <div className="absolute bottom-4 left-6 z-10 hidden md:flex items-center gap-2 text-[10px] font-mono text-[#8FA6BA] pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>SECURITY GATEWAY ACTIVE • 256-BIT AES</span>
      </div>

      <div className="w-full max-w-[440px] sm:max-w-[460px] mx-auto my-auto py-4 sm:py-6 flex flex-col relative z-10 min-w-0">
        
        {/* Navigation back button */}
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#06111F]/80 border border-cyan-500/20 text-xs font-medium text-slate-300 hover:text-cyan-300 hover:border-cyan-400/40 transition-all mb-4 self-start cursor-pointer group shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
          aria-label="Return to Overview page"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Overview</span>
        </button>

        {/* Mission-Control Security Terminal Glass Card */}
        <div className="glass-panel-elevated rounded-2xl p-5 sm:p-7 border border-cyan-500/25 shadow-[0_20px_60px_rgba(0,0,0,0.75),0_0_30px_rgba(0,200,255,0.08)] relative overflow-hidden flex flex-col bg-[#06111F]/90 backdrop-blur-2xl">
          
          {/* HUD Corner Reticles */}
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          {/* Top specular edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent pointer-events-none" />

          {/* Terminal Branding & Security Header */}
          <div className="flex flex-col items-center text-center space-y-2 mb-5">
            {/* GeoVision-SR Brand Logo */}
            <div className="flex items-center justify-center gap-2 mb-1">
              <img
                src="/assets/logo.png"
                alt="GeoVision-SR Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain mix-blend-screen select-none pointer-events-none"
                style={{ mixBlendMode: 'screen' }}
              />
              <span className="text-sm sm:text-base font-bold tracking-tight text-white font-sans">
                GeoVision<span className="text-cyan-400 font-medium">-SR</span>
              </span>
            </div>

            {/* Technical Sub-Tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-400/30 text-[10px] font-mono font-medium text-cyan-300 tracking-wider uppercase shadow-[0_0_12px_rgba(0,200,255,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
              <span>SECURE ACCESS TERMINAL</span>
            </div>

            <div className="space-y-1 pt-0.5">
              <h1 className="text-xl sm:text-[22px] font-bold tracking-tight text-white font-sans">
                Sign In to Platform
              </h1>
              <p className="text-xs text-[#8FA6BA] max-w-sm mx-auto leading-relaxed">
                Authenticate to access Sentinel-2 Super-Resolution & Cadastral Intelligence.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {successNotice && (
            <div className="mb-4 bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs rounded-xl p-3 flex items-start gap-2.5 shadow-[0_0_16px_rgba(16,185,129,0.15)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successNotice}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs rounded-xl p-3 flex items-start gap-2.5 shadow-[0_0_16px_rgba(244,63,94,0.15)]">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-300 font-sans tracking-wide"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="analyst@geovision.org"
                  className="w-full h-11 bg-[#040C18]/90 text-slate-100 text-xs rounded-xl pl-10 pr-3.5 font-sans placeholder:text-slate-500 border border-cyan-500/25 focus:border-[#00C8FF] focus:ring-1 focus:ring-[#00C8FF]/40 transition-colors shadow-inner"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-slate-300 font-sans tracking-wide"
                >
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  className="w-full h-11 bg-[#040C18]/90 text-slate-100 text-xs rounded-xl pl-10 pr-10 font-sans placeholder:text-slate-500 border border-cyan-500/25 focus:border-[#00C8FF] focus:ring-1 focus:ring-[#00C8FF]/40 transition-colors shadow-inner"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors p-1.5 cursor-pointer rounded-lg hover:bg-cyan-950/40"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* System Action Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 px-5 rounded-xl btn-glow-cyan flex items-center justify-between font-sans text-xs font-bold text-[#030B16] tracking-wide transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_4px_16px_rgba(0,200,255,0.3)] mt-2"
            >
              {isSubmitting ? (
                <div className="w-full flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-[#030B16] border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Session...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Terminal</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Integrated Account Switch Area */}
          <div className="mt-5 pt-4 border-t border-cyan-500/15 text-center">
            <p className="text-xs text-[#8FA6BA] font-sans">
              Don't have an operator account?{' '}
              <button
                type="button"
                onClick={onNavigateToRegister}
                className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer transition-colors ml-1 underline-offset-4 hover:underline"
              >
                Register here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

