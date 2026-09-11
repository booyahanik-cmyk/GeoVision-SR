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
  ArrowLeft
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
    <div className="w-full h-full text-slate-100 flex items-center justify-center p-4 sm:p-6 overflow-y-auto select-none font-sans relative">
      <div className="w-full max-w-[480px] sm:max-w-[500px] mx-auto my-auto py-6 sm:py-8 flex flex-col relative z-10">
        
        {/* Navigation back button */}
        <button
          type="button"
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-cyan-300 transition-colors mb-3 self-start cursor-pointer group"
          aria-label="Return to Overview page"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Overview</span>
        </button>

        {/* Elevated Glass Authentication Card */}
        <div className="glass-panel-elevated rounded-2xl p-6 sm:p-7 border border-cyan-500/20 shadow-[0_16px_40px_rgba(0,0,0,0.55),0_0_24px_rgba(6,182,212,0.1)] relative overflow-hidden flex flex-col">
          {/* Top specular edge highlight */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

          {/* Refined Security Header */}
          <div className="flex flex-col items-center text-center space-y-2 mb-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/50 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-[0_0_14px_rgba(6,182,212,0.18)] mb-0.5">
              <Lock className="w-4 h-4" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-[10px] font-mono font-medium text-cyan-300 tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>GeoVision Security Gateway</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-white font-sans">
                Sign In to Platform
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Authenticate to access Sentinel-2 Super-Resolution & Cadastral Intelligence.
              </p>
            </div>
          </div>

          {/* Success Banner */}
          {successNotice && (
            <div className="mb-4 bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{successNotice}</div>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="login-email"
                className="block text-xs font-semibold text-slate-300 font-sans"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cyan-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="w-full h-10 glass-input text-slate-100 text-xs rounded-xl pl-10 pr-3.5 font-sans placeholder:text-slate-500 border border-cyan-500/20 focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="login-password"
                className="block text-xs font-semibold text-slate-300 font-sans"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cyan-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="w-full h-10 glass-input text-slate-100 text-xs rounded-xl pl-10 pr-10 font-sans placeholder:text-slate-500 border border-cyan-500/20 focus:border-cyan-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors p-1 cursor-pointer"
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
              className="w-full h-10 px-5 rounded-xl btn-glow-cyan flex items-center justify-between font-sans text-xs font-bold text-slate-950 tracking-wide transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_2px_12px_rgba(6,182,212,0.25)] mt-4"
            >
              {isSubmitting ? (
                <div className="w-full flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Authenticating Session...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Integrated Account Switch Area */}
          <div className="mt-5 pt-4 border-t border-cyan-500/10 text-center">
            <p className="text-xs text-slate-400 font-sans">
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
