'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { App } from '@/types'; // Import our new type
import Cookies from 'js-cookie'; // Import the cookie library

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps) {
  const supabase = createClientComponentClient();

  // This function tracks the click AND sets the referral cookie
  const handleReferralClick = async (isMyReferral: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();

    const link = isMyReferral ? app.my_referral_link : app.link;
    const utmLink = `${link}?utm_source=quickearn&utm_medium=app_card&utm_campaign=${app.name}`;

    // --- START: ADDED COOKIE LOGIC ---
    try {
      // 1. Parse the link to find the '?ref=...' parameter
      const url = new URL(link); // Ensure link is a full URL or handle potential errors
      const urlParams = new URLSearchParams(url.search);
      const referrerId = urlParams.get('ref'); // Extract the value of 'ref'

      // 2. If a referrer ID exists in the link, save it to a cookie
      if (referrerId) {
        // Set a cookie named 'referrer_id' with the extracted ID.
        // It expires in 30 days. This implements "Last Click" attribution.
        Cookies.set('referrer_id', referrerId, { expires: 30, path: '/' });
        console.log(`Referrer cookie set: ${referrerId}`); // For debugging
      } else {
         // Optional: Clear the cookie if the link has no ref ID? Or leave the old one?
         // Decide based on your desired attribution logic. For last-click, overwriting is fine.
      }
    } catch (e) {
      console.error("Error processing referral link or setting cookie:", e);
      // Handle cases where 'link' might not be a valid URL
    }
    // --- END: ADDED COOKIE LOGIC ---


    // Log to YOUR 'referral_clicks' table (Existing code)
    const { error } = await supabase.from('referral_clicks').insert({
      user_id: user?.id ?? null, // Correctly handles anonymous users
      app: app.name,
      status: 'pending',
      timestamp: new Date().toISOString(),
      // You might want to add the referrerId here too, if the column exists
      // referred_by: referrerId ?? null
    });

    if (error) {
      console.error('Error logging click to Supabase:', error.message);
    }

    // TODO: Log GA4 client event based on consent
    // if (userHasConsented) { // You need a way to check consent status
    //   window.gtag('event', 'referral_click', {
    //     app_name: app.name,
    //     is_my_referral: isMyReferral,
    //     user_id: user?.id // Only if available and consented
    //   });
    // }

    // Redirect user (Existing code)
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
          // Assuming icon_url exists in your 'Referstore' table or App type
          src={app.icon_url || '/icons/placeholder.png'}
          alt={`${app.name} logo`}
          width={80}
          height={80}
          className="rounded-xl object-contain"
          // Add error handling for images
          onError={(e) => {
             // Handle broken image links, maybe show a default placeholder
             (e.target as HTMLImageElement).src = '/icons/placeholder.png';
          }}
        />
      </figure>
      <div className="card-body items-center text-center">
        <h2 className="card-title">{app.name}</h2>
        <div className="space-x-2 my-2"> {/* Added margin */}
          <div className="badge badge-primary badge-outline py-1 px-2"> {/* Added padding */}
            You Get: ₹{app.referee_bonus || 0} {/* Added fallback */}
          </div>
          <div className="badge badge-secondary badge-outline py-1 px-2"> {/* Added padding */}
            Friend Gets: ₹{app.referrer_bonus || 0} {/* Added fallback */}
          </div>
        </div>
        <p className="text-gray-600 mt-2 min-h-[40px] text-sm"> {/* Made text smaller */}
           {app.task || 'Complete simple task'} {/* Added fallback */}
        </p>
        <div className="card-actions w-full mt-4 space-y-2">
          <button
            className="btn btn-primary w-full"
            onClick={() => handleReferralClick(false)} // Call function on click
          >
            Download Now
          </button>
          {/* Only show "Use My Referral" if a link exists */}
          {app.my_referral_link && app.my_referral_link !== '#' && (
             <button
              className="btn btn-outline btn-sm w-full"
              onClick={() => handleReferralClick(true)} // Call function on click
            >
              Use My Referral
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
