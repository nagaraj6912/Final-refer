'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient'; // Corrected import
import { App } from '@/types';
import Cookies from 'js-cookie'; // <-- ADDED: Import the cookie library
import { useEffect, useState } from 'react'; // Added for image error handling

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps) {
  const supabase = createSupabaseBrowserClient(); // Corrected client
  // Initialize state with fallback, ensuring app.icon_url is accessed safely
  const [imgSrc, setImgSrc] = useState(app?.icon_url || '/icons/placeholder.png');

  // Handle image loading errors and update if app prop changes
  useEffect(() => {
    setImgSrc(app?.icon_url || '/icons/placeholder.png');
  }, [app?.icon_url]);

  // This function tracks the click AND saves the referrer cookie
  const handleReferralClick = async (isMyReferral: boolean) => {
    // Ensure app object exists before proceeding
    if (!app) {
        console.error("App data is missing in AppCard.");
        alert("Sorry, there was an error loading app details.");
        return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Determine the link, providing fallbacks and ensuring it's not null/undefined
    const link = isMyReferral
        ? (app.my_referral_link || app.link || '#')
        : (app.link || '#');

    let referrerId = null;

    // --- ADDED: Cookie Logic ---
    if (link && link !== '#') { // Only try to parse valid links
        try {
            // Ensure URL is absolute for parsing, handle potential invalid links gracefully
            // Correctly handle relative vs absolute links
            const absoluteLink = link.startsWith('http') ? link : new URL(link, window.location.origin).toString();
            const url = new URL(absoluteLink);
            const urlParams = new URLSearchParams(url.search);
            referrerId = urlParams.get('ref'); // Assumes your link uses '?ref=...'

            if (referrerId && !user) { // Only set cookie if user is not logged in
                console.log(`Setting referrer cookie: ${referrerId}`);
                Cookies.set('referrer_id', referrerId, { expires: 30, path: '/' }); // 30-day cookie, site-wide
            }
        } catch (e) {
            console.error("Error parsing link URL or setting cookie:", e, "Link:", link);
            // Link might be invalid (#, javascript:, etc.) or URL constructor failed.
            // Proceed without setting cookie but still log click if possible.
        }
    }
    // --- END: Cookie Logic ---

    // Construct UTM link regardless of cookie success, only if link is valid
    const utmLink = (link && link !== '#')
        ? `${link}${link.includes('?') ? '&' : '?'}utm_source=quickearn&utm_medium=app_card&utm_campaign=${app.name || 'unknown_app'}`
        : '#';


    // Log to YOUR 'referral_clicks' table
    const { error } = await supabase.from('referral_clicks').insert({
      user_id: user?.id ?? null,
      app: app.name ?? 'Unknown App', // Add fallback for app name
      status: 'pending',
      timestamp: new Date().toISOString(),
      // Optionally store the detected referrerId in meta even for anon clicks
      meta: referrerId ? { detected_referrer: referrerId } : null
    });

    if (error) {
      console.error('Error logging click:', error.message);
    }

    // TODO: Log GA4 client event if consent given
    // if (user?.user_metadata?.has_consented_tracking) {
    //   window.gtag('event', 'referral_click', { app_name: app.name });
    // }

    // Redirect user only if the link is valid and not just '#'
    if (utmLink !== '#') {
        window.open(utmLink, '_blank');
    } else {
        console.warn(`No valid redirect link found for app: ${app?.name || 'Unknown App'}`);
        // Replace alert with a less disruptive notification if preferred
        alert("Sorry, the link for this app is currently unavailable.");
    }
  };

  // Render fallback if app data is missing
  if (!app) {
      return (
          <div className="card bg-base-100 shadow-xl border border-gray-200 p-6 text-center text-error">
              App data unavailable.
          </div>
      );
  }

  return (
    <motion.div
      className="card bg-base-100 shadow-xl border border-gray-200 flex flex-col" // Added flex flex-col
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
    >
      <figure className="px-6 pt-6 h-24 flex items-center justify-center"> {/* Fixed height */}
        <Image
          src={imgSrc} // State variable handles fallback
          alt={`${app.name || 'App'} logo`}
          width={80}
          height={80}
          className="rounded-xl object-contain max-h-full" // Ensure image fits
          onError={() => {
            console.warn(`Image failed to load: ${app.icon_url}, falling back to placeholder.`);
            setImgSrc('/icons/placeholder.png'); // Fallback on error
          }}
          // Consider adding unoptimized prop if placeholder/external images cause issues
          // unoptimized={imgSrc === '/icons/placeholder.png'}
        />
      </figure>
      <div className="card-body items-center text-center flex-grow"> {/* Added flex-grow */}
        <h2 className="card-title">{app.name || 'Referral App'}</h2>
        <div className="space-x-2 my-1"> {/* Added margin */}
          <div className="badge badge-primary badge-outline text-xs p-2"> {/* Smaller badge */}
            You Get: ₹{app.referee_bonus || 0}
          </div>
          <div className="badge badge-secondary badge-outline text-xs p-2"> {/* Smaller badge */}
            Friend Gets: ₹{app.referrer_bonus || 0}
          </div>
        </div>
        <p className="text-gray-600 mt-2 min-h-[40px] text-sm flex-grow"> {/* Smaller text, flex-grow */}
          {app.task || 'Complete simple task'}
        </p>
        <div className="card-actions w-full mt-auto space-y-2"> {/* mt-auto pushes buttons down */}
          <button
            className="btn btn-primary w-full"
            onClick={() => handleReferralClick(false)}
            // Disable button if no valid link exists
            disabled={!app.link || app.link === '#'}
          >
            Download Now
          </button>
          <button
            className="btn btn-outline btn-sm w-full"
            onClick={() => handleReferralClick(true)}
            // Disable button if no valid referral link exists
            disabled={!app.my_referral_link || app.my_referral_link === '#'}
          >
            Use My Referral
          </button>
        </div>
      </div>
    </motion.div>
  );
}

