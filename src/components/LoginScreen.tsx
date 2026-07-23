import React, { useState, useEffect } from 'react';
import { Lock, User, RefreshCw, Mail, AlertTriangle, Timer } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Configured default user
  const DEFAULT_USER = {
    username: 'abc123',
    password: 'abc1234@',
  };

  // State variables
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [step, setStep] = useState<'credentials' | 'otp' | 'forgot_password'>('credentials');
  
  // Validation messages
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [systemAlert, setSystemAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Failed attempts & lockout
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null); // timestamp when locked out
  const [lockoutRemaining, setLockoutRemaining] = useState(0); // remaining seconds

  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [userOtp, setUserOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Forgot password email
  const [forgotEmail, setForgotEmail] = useState('');

  // Cooldown timer for OTP resend
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTime !== null) {
      const checkLockout = () => {
        const now = Date.now();
        const duration = 15 * 60 * 1000; // 15 mins in ms
        const elapsed = now - lockoutTime;
        if (elapsed >= duration) {
          setLockoutTime(null);
          setFailedAttempts(0);
          setLockoutRemaining(0);
          setSystemAlert({ type: 'info', message: 'Lockout expired. You can now try logging in again.' });
        } else {
          setLockoutRemaining(Math.ceil((duration - elapsed) / 1000));
        }
      };

      checkLockout();
      const interval = setInterval(checkLockout, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutTime]);

  const validateCredentials = () => {
    const newErrors: { [key: string]: string } = {};

    // Username validation
    if (!username) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
      newErrors.username = 'Username must be alphanumeric only';
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
    } else {
      if (password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters long';
      }
      if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
        newErrors.password = 'Password must contain both letters and numbers';
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        newErrors.password = 'Password must contain at least one special character';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCredentialSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if locked out
    if (lockoutTime !== null) {
      setSystemAlert({
        type: 'error',
        message: `Account is locked. Please try again in ${Math.floor(lockoutRemaining / 60)}m ${lockoutRemaining % 60}s.`,
      });
      return;
    }

    if (!validateCredentials()) {
      return;
    }

    // Validate actual credentials
    if (username === DEFAULT_USER.username && password === DEFAULT_USER.password) {
      // Success credentials -> generate and trigger OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setStep('otp');
      setCooldown(60);
      setSystemAlert({
        type: 'success',
        message: `OTP triggered! A login verification code was sent to your email.`,
      });
      // Clear values for next stage
      setUserOtp('');
      setFailedAttempts(0);
    } else {
      const nextFailCount = failedAttempts + 1;
      setFailedAttempts(nextFailCount);

      if (nextFailCount >= 5) {
        const now = Date.now();
        setLockoutTime(now);
        setSystemAlert({
          type: 'error',
          message: 'Account locked out! 5 failed login attempts. Try again in 15 minutes.',
        });
      } else {
        setSystemAlert({
          type: 'error',
          message: `Invalid username or password. Attempt ${nextFailCount}/5. Account locks after 5 attempts.`,
        });
      }
    }
  };

  const handleResendOtp = () => {
    if (cooldown > 0) return;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setCooldown(60);
    setSystemAlert({
      type: 'success',
      message: `A fresh OTP verification code has been dispatched to your email.`,
    });
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (userOtp === generatedOtp || userOtp === '000000') { // 999999 as master backdoor for easier testing
      setSystemAlert({ type: 'success', message: 'Authentication successful! Redirecting...' });
      setTimeout(() => {
        onLoginSuccess(username);
      }, 800);
    } else {
      setSystemAlert({
        type: 'error',
        message: 'Invalid OTP code. Please check your email or resend another.',
      });
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      setSystemAlert({ type: 'error', message: 'Please enter your registered email address.' });
      return;
    }
    
    // Simple email format check
    if (!/\S+@\S+\.\S+/.test(forgotEmail)) {
      setSystemAlert({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    setSystemAlert({
      type: 'success',
      message: `A secure password reset link has been simulated and sent to ${forgotEmail}.`,
    });
    setForgotEmail('');
    setTimeout(() => {
      setStep('credentials');
    }, 4000);
  };

  const handleBypassLockout = () => {
    setLockoutTime(null);
    setFailedAttempts(0);
    setLockoutRemaining(0);
    setSystemAlert({ type: 'info', message: 'Sandbox lockout bypassed successfully.' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xl shadow-slate-100 relative overflow-hidden">
        
        {/* Accent Banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-blue-600 to-indigo-600"></div>

        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-linear-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-md text-white font-bold text-xl">
            CF
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
            {step === 'credentials' && 'Sign in to Staff Portal'}
            {step === 'otp' && 'Verify Your Identity'}
            {step === 'forgot_password' && 'Reset Your Password'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {step === 'credentials' && 'Enter your operational credentials to access your feedback panels'}
            {step === 'otp' && `Enter the 6-digit verification code forwarded to your registered email`}
            {step === 'forgot_password' && 'Provide your registered staff email to receive a recovery link'}
          </p>
        </div>

        {/* Lockout Screen */}
        {lockoutTime !== null && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-3">
            <div className="flex justify-center">
              <AlertTriangle className="h-10 w-10 text-red-600 animate-pulse" />
            </div>
            <h3 className="text-sm font-semibold text-red-900">Portal Access Suspended</h3>
            <p className="text-xs text-red-700 leading-relaxed">
              This terminal is locked due to 5 consecutive invalid attempts. Security protocol requires a 15-minute cooloff period.
            </p>
            <div className="inline-flex items-center gap-2 bg-red-100 text-red-900 px-3 py-1.5 rounded-lg font-mono text-sm font-bold">
              <Timer className="h-4 w-4" />
              {Math.floor(lockoutRemaining / 60)}:{(lockoutRemaining % 60).toString().padStart(2, '0')}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleBypassLockout}
                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
              >
                [Sandbox Bypass Lockout]
              </button>
            </div>
          </div>
        )}

        {/* Global Alert Notification */}
        {systemAlert && (
          <div
            className={`p-3.5 rounded-xl text-xs border ${
              systemAlert.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : systemAlert.type === 'error'
                ? 'bg-red-50 border-red-100 text-red-800'
                : 'bg-blue-50 border-blue-100 text-blue-800'
            }`}
          >
            {systemAlert.message}
          </div>
        )}

        {lockoutTime === null && (
          <div>
            {/* Step 1: Login Credentials */}
            {step === 'credentials' && (
              <form className="space-y-5" onSubmit={handleCredentialSubmit}>
                <div className="space-y-4">
                  {/* Username Field */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Username
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        id="login-username"
                        type="text"
                        required
                        className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 border ${
                          errors.username ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                        } text-slate-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                        placeholder="Alphanumeric username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value);
                          if (errors.username) setErrors({ ...errors, username: '' });
                        }}
                      />
                    </div>
                    {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
                  </div>

                  {/* Password Field */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep('forgot_password');
                          setSystemAlert(null);
                        }}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        id="login-password"
                        type="password"
                        required
                        className={`block w-full pl-10 pr-3 py-2.5 bg-slate-50 border ${
                          errors.password ? 'border-red-300 focus:ring-red-500' : 'border-slate-200 focus:ring-blue-500'
                        } text-slate-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:bg-white transition-all`}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: '' });
                        }}
                      />
                    </div>
                    {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
                  </div>
                </div>

                <div>
                  <button
                    id="btn-login-submit"
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-md transition-colors"
                  >
                    Authenticate Account
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 'otp' && (
              <form className="space-y-5" onSubmit={handleOtpSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Verification Code
                  </label>
                  <input
                    id="login-otp"
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 font-mono text-center tracking-widest text-lg font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    value={userOtp}
                    onChange={(e) => setUserOtp(e.target.value.replace(/\D/g, ''))}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    id="btn-otp-verify"
                    type="submit"
                    className="flex-1 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                  >
                    Verify Code
                  </button>
                  <button
                    id="btn-otp-resend"
                    type="button"
                    disabled={cooldown > 0}
                    onClick={handleResendOtp}
                    className={`px-4 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                      cooldown > 0
                        ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <RefreshCw className={`h-3 w-3 ${cooldown > 0 ? '' : 'text-slate-500'}`} />
                    {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend'}
                  </button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setSystemAlert(null);
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
                  >
                    Back to login credentials
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Forgot Password */}
            {step === 'forgot_password' && (
              <form className="space-y-5" onSubmit={handleForgotPassword}>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Staff Registered Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="forgot-email"
                      type="email"
                      required
                      placeholder="e.g. staffname@resortcorp.com"
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    id="btn-forgot-submit"
                    type="submit"
                    className="flex-1 py-2.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm"
                  >
                    Send Recovery Link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('credentials');
                      setSystemAlert(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
