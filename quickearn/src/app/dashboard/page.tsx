'use client';

import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Define types for our data
type Click = {
  id: string;
  app: string;
  timestamp: string;
  status: string;
};

type Reward = {
  balance: number;
};

export default function DashboardPage() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [clicks, setClicks] = useState<Click[]>([]);
  const [reward, setReward] = useState<Reward | null>({ balance: 0 });
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  // Fetch all user data on page load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Not logged in, redirect to homepage
        window.location.href = '/';
        return;
      }
      setUser(user);
      setUpiId(user.user_metadata?.upi_id || '');

      // Fetch click history from your 'referral_clicks' table
      const { data: clickData, error: clickError } = await supabase
        .from('referral_clicks')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      if (clickData) setClicks(clickData);
      if (clickError) console.error('Error fetching clicks:', clickError);

      // TODO: Fetch reward balance from your 'rewards' table
      // const { data: rewardData, error: rewardError } = await supabase
      //   .from('rewards')
      //   .select('balance')
      //   .eq('user_id', user.id)
      //   .single();
      // if (rewardData) setReward(rewardData);
      
      setLoading(false);
    };
    fetchData();
  }, [supabase]);

  const handleUpiUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    const response = await fetch('/api/update-upi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ upiId }),
    });

    const result = await response.json();
    if (response.ok) {
      setMessage('Success! UPI ID updated.');
    } else {
      setMessage(`Error: ${result.error}`);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading Dashboard...</div>;
  }

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <motion.h1 
        className="text-3xl font-bold mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        Welcome, {user?.email}
      </motion.h1>

      <div className="tabs tabs-boxed mb-6">
        <a className="tab tab-active">Rewards</a>
        <a className="tab">Click History</a>
        <a className="tab">Profile</a>
      </div>

      {/* Tab 1: Rewards & Profile */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {/* Rewards Section */}
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">Your Rewards</h2>
            <p className="text-5xl font-bold text-primary">
              ₹{reward?.balance || 0}
            </p>
            <p className="text-gray-500">Total balance pending</p>
            <div className="card-actions justify-end mt-4">
              <button 
                className="btn btn-primary" 
                disabled={(reward?.balance || 0) < 100}
              >
                Claim ₹{reward?.balance || 0} (Min ₹100)
              </button>
            </div>
          </div>
        </div>

        {/* Profile / UPI Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Profile Settings</h2>
            <form onSubmit={handleUpiUpdate}>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Your UPI ID (for payouts)</span>
                </label>
                <input
                  type="text"
                  placeholder="yourname@upi"
                  className="input input-bordered w-full"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-secondary mt-4">
                Save UPI ID
              </button>
              {message && <p className="text-sm mt-2">{message}</p>}
            </form>
          </div>
        </div>
      </motion.div>

      {/* TODO: Tab 2: Click History */}
      {/* <div className="hidden"> ... click history table ... </div> */}

    </div>
  );
}