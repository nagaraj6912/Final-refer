'use client';

import Link from 'next/link';
import { useState } from 'react';
import LoginModal from '../LoginModal'; // Import the modal
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useEffect } from 'react';

export default function Navbar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseBrowserClient();

  // Check for a logged-in user on component load
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Optionally redirect to homepage
    window.location.href = '/';
  };

  return (
    <>
      <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
        <div className="navbar-start">
          <div className="dropdown">
            <label tabIndex={0} className="btn btn-ghost lg:hidden">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" /></svg>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li><Link href="/categories">Categories</Link></li>
              <li><Link href="/quiz">Quiz</Link></li>
              <li><Link href="/blog">Blog</Link></li>
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost text-xl text-primary font-bold">
            QuickEarn
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li><Link href="/categories">Categories</Link></li>
            <li><Link href="/quiz">Quiz</Link></li>
            <li><Link href="/blog">Blog</Link></li>
          </ul>
        </div>
        <div className="navbar-end">
          {user ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                <div className="w-10 rounded-full">
                  {/* Display Google profile pic or a default icon */}
                  <img alt="User profile" src={user.user_metadata?.avatar_url || 'https://api.lorem.space/image/face?hash=33791'} />
                </div>
              </label>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <Link href="/dashboard" className="justify-between">
                    Dashboard
                    <span className="badge">New</span>
                  </Link>
                </li>
                <li><button onClick={handleLogout}>Logout</button></li>
              </ul>
            </div>
          ) : (
            <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
              Login
            </button>
          )}
        </div>
      </div>
      
      {/* This line activates the login modal */}
      <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}