'use client';

import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState('');
  const [hasConsented, setHasConsented] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsented) {
      setMessage('You must agree to the terms to continue.');
      return;
    }
    setIsLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // Store consent in user_metadata
        data: {
          has_consented_tracking: hasConsented,
        },
      },
    });

    setIsLoading(false);
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Check your email for the magic link!');
      setEmail('');
    }
  };

  const handleGoogleLogin = async () => {
    if (!hasConsented) {
      setMessage('You must agree to the terms to continue.');
      return;
    }
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          has_consented_tracking: hasConsented,
        },
      },
    });
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="modal-box"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <button
          onClick={onClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          ✕
        </button>
        <h3 className="font-bold text-lg text-center">Login to QuickEarn</h3>
        <p className="py-4 text-center">
          Track your clicks and claim your rewards!
        </p>

        <button
          className="btn btn-outline w-full mb-4"
          onClick={handleGoogleLogin}
        >
          {/* Add Google Icon SVG here */}
          Continue with Google
        </button>

        <div className="divider">OR</div>

        <form onSubmit={handleMagicLink}>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              placeholder="you@email.com"
              className="input input-bordered w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className={`btn btn-primary w-full mt-4 ${
              isLoading ? 'loading' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>

        <div className="form-control mt-4">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
            />
            <span className="label-text text-xs">
              I agree to tracking for rewards calculation (RBI/GDPR).
            </span>
          </label>
        </div>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.includes('Error') ? 'text-error' : 'text-success'
            }`}
          >
            {message}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}