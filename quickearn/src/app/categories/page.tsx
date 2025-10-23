'use client';

import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { App } from '@/types';
import { useEffect, useState } from 'react';
import AppCard from '@/components/AppCard';
import LoginModal from '@/components/LoginModal'; // Import the modal
import { User } from '@supabase/supabase-js';

export default function CategoriesPage() {
  const [allApps, setAllApps] = useState<App[]>([]);
  const [filteredApps, setFilteredApps] = useState<App[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  
  // --- NEW AUTH LOGIC ---
  const [user, setUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --- END NEW AUTH LOGIC ---

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const supabase = createSupabaseBrowserClient();
      
      // 1. Check for a user
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // 2. If no user, stop loading and show the login prompt
      if (!user) {
        setLoading(false);
        setIsModalOpen(true); // Automatically open the login modal
        return;
      }

      // 3. If user exists, fetch apps (this is your old code)
      const { data, error } = await supabase
        .from('Referstore')
        .select('*');

      if (error) {
        console.error('Error fetching apps:', error);
      } else if (data) {
        setAllApps(data);
        setFilteredApps(data);
        const uniqueCategories = ['All', ...Array.from(new Set(data.map(app => app.category)))];
        setCategories(uniqueCategories);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleFilter = (category: string) => {
    // ... (This function remains the same as before)
    setActiveCategory(category);
    if (category === 'All') {
      setFilteredApps(allApps);
    } else {
      const filtered = allApps.filter(app => app.category === category);
      setFilteredApps(filtered);
    }
  };

  // --- NEW RENDER LOGIC ---

  if (loading) {
    return <div className="text-center py-20">Loading...</div>;
  }

  // If NOT logged in, show a "call to action"
  if (!user) {
    return (
      <>
        <div className="text-center py-20">
          <h1 className="text-3xl font-bold mb-4">See All 30+ Apps</h1>
          <p className="text-lg mb-6">Please log in to unlock all categories and track your rewards.</p>
          <button className="btn btn-primary btn-lg" onClick={() => setIsModalOpen(true)}>
            Login to Continue
          </button>
        </div>
        <LoginModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </>
    );
  }

  // If LOGGED in, show the full page
  return (
    <div className="container mx-auto max-w-6xl p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">All Apps</h1>

      {/* Sticky Tab Navigation */}
      <div className="tabs tabs-boxed sticky top-[70px] z-40 bg-base-100 shadow-sm mb-8 overflow-x-auto">
        {categories.map((category) => (
          <a
            key={category}
            className={`tab ${activeCategory === category ? 'tab-active' : ''}`}
            onClick={() => handleFilter(category)}
          >
            {category}
          </a>
        ))}
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => (
          <AppCard key={app.id} app={app} />
        ))}
      </div>
    </div>
  );
}