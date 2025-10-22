'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { App } from '@/types'; // Import our new type

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps) {
  const supabase = createSupabaseBrowserClient();

  // This function tracks the click
  const handleReferralClick = async (isMyReferral: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();

    const link = isMyReferral ? app.my_referral_link : app.link;
    const utmLink = `${link}?utm_source=quickearn&utm_medium=app_card&utm_campaign=${app.name}`;

    // Log to YOUR 'referral_clicks' table
    const { error } = await supabase.from('referral_clicks').insert({
      user_id: user?.id ?? null,
      app: app.name,
      status: 'pending',
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('Error logging click:', error.message);
    }
    
    // TODO: Log GA4 client event
    // window.gtag('event', 'referral_click', { ... });

    // Redirect user
    window.open(utmLink, '_blank');
  };

  return (
    <motion.div
      className="card bg-base-100 shadow-xl border border-gray-200"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
    >
      <figure className="px-6 pt-6">
        <Image
          src={app.icon_url || '/icons/placeholder.png'} // Assumes icon_url field
          alt={`${app.name} logo`}
          width={80}
          height={80}
          className="rounded-xl object-contain"
        />
      </figure>
      <div className="card-body items-center text-center">
        <h2 className="card-title">{app.name}</h2>
        <div className="space-x-2">
          <div className="badge badge-primary badge-outline">
            You Get: ₹{app.referee_bonus}
          </div>
          <div className="badge badge-secondary badge-outline">
            Friend Gets: ₹{app.referrer_bonus}
          </div>
        </div>
        <p className="text-gray-600 mt-2 min-h-[40px]">{app.task}</p>
        <div className="card-actions w-full mt-4 space-y-2">
          <button
            className="btn btn-primary w-full"
            onClick={() => handleReferralClick(false)}
          >
            Download Now
          </button>
          <button
            className="btn btn-outline btn-sm w-full"
            onClick={() => handleReferralClick(true)}
          >
            Use My Referral
          </button>
        </div>
      </div>
    </motion.div>
  );
}