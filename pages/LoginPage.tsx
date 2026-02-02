import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Hexagon, Lock, Mail, ArrowRight, AlertCircle, User } from 'lucide-react';
import { APP_CONFIG } from '../config';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('alice@acme.com'); // Pre-filled for demo
  const [password, setPassword] = useState('password'); // Pre-filled for demo
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      // Login successful
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
      setEmail(demoEmail);
      setPassword('password');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex justify-center mb-6">
          <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-slate-200 overflow-hidden shrink-0 border border-slate-100">
            <img src={APP_CONFIG.assets.favicon} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-slate-900">
          Sign in to {APP_CONFIG.name}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Or{' '}
          <Link to="/signup" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
            start your 14-day free trial
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 p-2.5 border"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-emerald-600 hover:text-emerald-500">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {isLoading ? 'Verifying...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500 uppercase tracking-wide text-xs font-semibold">One-Click Demo Login</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('alice@acme.com')}
                className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all hover:border-emerald-300 hover:shadow-md group text-left"
              >
                <img src="https://i.pravatar.cc/150?u=alice" alt="Alice" className="w-10 h-10 rounded-full border border-slate-100" />
                <div>
                   <p className="text-sm font-bold text-slate-800 group-hover:text-emerald-700">Alice Admin</p>
                   <p className="text-xs text-slate-500">Store Manager • Acme Corp</p>
                </div>
                <div className="ml-auto text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Log In →</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('tony@stark.com')}
                className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 transition-all hover:border-amber-300 hover:shadow-md group text-left"
              >
                <img src="https://i.pravatar.cc/150?u=tony" alt="Tony" className="w-10 h-10 rounded-full border border-slate-100" />
                <div>
                   <p className="text-sm font-bold text-slate-800 group-hover:text-amber-700">Tony Stark</p>
                   <p className="text-xs text-slate-500">Super Admin • Stark Ind</p>
                </div>
                <div className="ml-auto text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold">Log In →</div>
              </button>
            </div>
            
            <p className="mt-6 text-center text-xs text-slate-400">
               For security, a login alert will be sent to the dashboard notifications upon sign in.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};