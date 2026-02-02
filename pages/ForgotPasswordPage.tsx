import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';
import { emailService } from '../services/emailService';
import { APP_CONFIG } from '../config';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call using our Email Service
    try {
      await emailService.sendPasswordReset(email);
      setIsSubmitted(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
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
          Reset your password
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Enter your email and we'll send you a reset link
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-xl sm:px-10 border border-slate-100">
          {!isSubmitted ? (
            <form className="space-y-6" onSubmit={handleSubmit}>
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
                    className="block w-full pl-10 sm:text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 p-2.5 border"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                >
                   {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Check your email</h3>
              <p className="mt-2 text-sm text-slate-500">
                We've sent a password reset link to <span className="font-semibold text-slate-900">{email}</span>.
              </p>
              <div className="mt-6">
                <Link
                  to="/login"
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
          
          {!isSubmitted && (
            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 text-sm">
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};