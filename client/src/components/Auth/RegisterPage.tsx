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
              <Shield className="w-4 h-4" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-950/40 border border-cyan-500/20 text-[10px] font-mono font-medium text-cyan-300 tracking-wider uppercase">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Operator Onboarding</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-white font-sans">
                Create New Account
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Register for geospatial analysis, SWIR processing, and cadastral auditing.
              </p>
            </div>
          </div>

          {/* General Error Banner */}
          {generalError && (
            <div className="mb-4 bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs rounded-xl p-3 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">{generalError}</div>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label 
                htmlFor="register-name"
                className="block text-xs font-semibold text-slate-300 font-sans"
              >
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-cyan-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className={`w-full h-10 glass-input text-slate-100 text-xs rounded-xl pl-10 pr-3.5 font-sans placeholder:text-slate-500 border ${
                    fieldErrors.name ? 'border-rose-500/60 focus:border-rose-400' : 'border-cyan-500/20 focus:border-cyan-400'
                  } transition-colors`}
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
                className="block text-xs font-semibold text-slate-300 font-sans"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cyan-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className={`w-full h-10 glass-input text-slate-100 text-xs rounded-xl pl-10 pr-3.5 font-sans placeholder:text-slate-500 border ${
                    fieldErrors.email ? 'border-rose-500/60 focus:border-rose-400' : 'border-cyan-500/20 focus:border-cyan-400'
                  } transition-colors`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1 font-sans mt-1">
                  <span className="w-1 h-1 rounded-full bg-rose-400" />
                  <span>{fieldErrors.email}</span>
                </p>
              )}
            </div>

            {/* Password & Confirm Password side-by-side on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Password Field */}
              <div className="space-y-1.5">
                <label 
                  htmlFor="register-password"
                  className="block text-xs font-semibold text-slate-300 font-sans truncate"
                >
                  Password (min. 8)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cyan-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    className={`w-full h-10 glass-input text-slate-100 text-xs rounded-xl pl-10 pr-9 font-sans placeholder:text-slate-500 border ${
                      fieldErrors.password ? 'border-rose-500/60 focus:border-rose-400' : 'border-cyan-500/20 focus:border-cyan-400'
                    } transition-colors`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-300 transition-colors p-1 cursor-pointer"
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
                  className="block text-xs font-semibold text-slate-300 font-sans truncate"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-cyan-400/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                    className={`w-full h-10 glass-input text-slate-100 text-xs rounded-xl pl-10 pr-3.5 font-sans placeholder:text-slate-500 border ${
                      fieldErrors.confirmPassword ? 'border-rose-500/60 focus:border-rose-400' : 'border-cyan-500/20 focus:border-cyan-400'
                    } transition-colors`}
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
              className="w-full h-10 px-5 rounded-xl btn-glow-cyan flex items-center justify-between font-sans text-xs font-bold text-slate-950 tracking-wide transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_2px_12px_rgba(6,182,212,0.25)] mt-4"
            >
              {isSubmitting ? (
                <div className="w-full flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
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
          <div className="mt-5 pt-4 border-t border-cyan-500/10 text-center">
            <p className="text-xs text-slate-400 font-sans">
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
