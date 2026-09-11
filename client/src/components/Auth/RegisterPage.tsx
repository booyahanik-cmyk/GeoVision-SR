import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/api';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles,
  ArrowLeft,
  Shield
} from 'lucide-react';

interface RegisterPageProps {
  onSuccess: (message: string) => void;
  onNavigateToLogin: () => void;
  onBackToLanding: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccess,
  onNavigateToLogin,
  onBackToLanding,
}) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field-specific validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Please enter name';
    } else if (name.trim().length < 3 || name.trim().length > 50) {
      errors.name = 'Name should be between 3 - 50 characters';
    }

    if (!email.trim()) {
      errors.email = 'Enter a valid email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 8) {
      errors.password = 'Password should be at least 8 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Successful registration: Redirect to login with confirmation notice
      onSuccess('Account created successfully! You can now sign in with your credentials.');
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
          setFieldErrors(err.fieldErrors);
        } else if (err.message && err.message.toLowerCase().includes('already registered')) {
          setFieldErrors({ email: 'Email already registered. Please sign in or use another email.' });
        } else {
          setGeneralError(err.message || 'Registration failed. Please check your details and try again.');
        }
      } else {
        setGeneralError('Network connection failed. Please verify backend server connectivity.');
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
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>NODE: GVS-AUTH-02 // TLS 1.3 SECURE</span>
      </div>
      <div className="absolute bottom-4 left-6 z-10 hidden md:flex items-center gap-2 text-[10px] font-mono text-[#8FA6BA] pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span>OPERATOR REGISTRATION PROTOCOL ACTIVE</span>
      </div>

      <div className="w-full max-w-[460px] sm:max-w-[500px] mx-auto my-auto py-4 sm:py-6 flex flex-col relative z-10 min-w-0">
        
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
              <Shield className="w-3 h-3 text-cyan-400" />
              <span>OPERATOR ONBOARDING GATEWAY</span>
            </div>

            <div className="space-y-1 pt-0.5">
              <h1 className="text-xl sm:text-[22px] font-bold tracking-tight text-white font-sans">
                Create Operator Account
              </h1>
              <p className="text-xs text-[#8FA6BA] max-w-sm mx-auto leading-relaxed">
                Register for geospatial analysis, SWIR processing, and cadastral auditing.
              </p>
            </div>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-4 bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs rounded-xl p-3 flex items-start gap-2.5 shadow-[0_0_16px_rgba(244,63,94,0.15)]">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{generalError}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="register-name"
                className="block text-xs font-semibold text-slate-300 font-sans tracking-wide"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="register-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) {
                      setFieldErrors((prev) => ({ ...prev, name: '' }));
                    }
                  }}
                  placeholder="Dr. Rajesh Kumar"
                  className={`w-full h-11 bg-[#040C18]/90 text-slate-100 text-xs rounded-xl pl-10 pr-3.5 font-sans placeholder:text-slate-500 border ${
                    fieldErrors.name ? 'border-rose-500/60 focus:border-rose-400' : 'border-cyan-500/25 focus:border-[#00C8FF] focus:ring-1 focus:ring-[#00C8FF]/40'
                  } transition-colors shadow-inner`}
                />
              </div>
              {fieldErrors.name && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans mt-1">
                  <span className="w-1 h-1 rounded-full bg-rose-400" />
                  <span>{fieldErrors.name}</span>
                </p>
              )}
            </div>

            {/* Email Address Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="register-email"
                className="block text-xs font-semibold text-slate-300 font-sans tracking-wide"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="register-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="rajesh@geovision.org"
                  className={`w-full h-11 bg-[#040C18]/90 text-slate-100 text-xs rounded-xl pl-10 pr-3.5 font-sans placeholder:text-slate-500 border ${
                    fieldErrors.email ? 'border-rose-500/60 focus:border-rose-400' : 'border-cyan-500/25 focus:border-[#00C8FF] focus:ring-1 focus:ring-[#00C8FF]/40'
                  } transition-colors shadow-inner`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans mt-1">
                  <span className="w-1 h-1 rounded-full bg-rose-400" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password & Confirm Password responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Password Field */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="register-password"
                  className="block text-xs font-semibold text-slate-300 font-sans tracking-wide truncate"
                >
                  Password (min. 8)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (fieldErrors.password) {
                        setFieldErrors((prev) => ({ ...prev, password: '' }));
                      }
                    }}
                    placeholder="••••••••"
                    className={`w-full h-11 bg-[#040C18]/90 text-slate-100 text-xs rounded-xl pl-10 pr-9 font-sans placeholder:text-slate-500 border ${
                      fieldErrors.password ? 'border-rose-500/60 focus:border-rose-400' : 'border-cyan-500/25 focus:border-[#00C8FF] focus:ring-1 focus:ring-[#00C8FF]/40'
                    } transition-colors shadow-inner`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors p-1 cursor-pointer rounded-lg hover:bg-cyan-950/40"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans mt-1">
                    <span className="w-1 h-1 rounded-full bg-rose-400" />
                    <span>{fieldErrors.password}</span>
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="register-confirm-password"
                  className="block text-xs font-semibold text-slate-300 font-sans tracking-wide truncate"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cyan-400/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="register-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (fieldErrors.confirmPassword) {
                        setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                      }
                    }}
                    placeholder="••••••••"
                    className={`w-full h-11 bg-[#040C18]/90 text-slate-100 text-xs rounded-xl pl-10 pr-3.5 font-sans placeholder:text-slate-500 border ${
                      fieldErrors.confirmPassword ? 'border-rose-500/60 focus:border-rose-400' : 'border-cyan-500/25 focus:border-[#00C8FF] focus:ring-1 focus:ring-[#00C8FF]/40'
                    } transition-colors shadow-inner`}
                  />
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans mt-1">
                    <span className="w-1 h-1 rounded-full bg-rose-400" />
                    <span>{fieldErrors.confirmPassword}</span>
                  </p>
                )}
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
                  <span>Creating Account...</span>
                </div>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Integrated Account Switch Area */}
          <div className="mt-5 pt-4 border-t border-cyan-500/15 text-center">
            <p className="text-xs text-[#8FA6BA] font-sans">
              Already have an operator account?{' '}
              <button
                type="button"
                onClick={onNavigateToLogin}
                className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer transition-colors ml-1 underline-offset-4 hover:underline"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
