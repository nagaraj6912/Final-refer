import AppCard from '@/components/AppCard';
import FomoTimer from '@/components/FomoTimer';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import fallbackApps from '@/lib/apps.json'; // Fallback data - we'll create this file later
import type { App } from '@/types';

// Lovable.app can edit these props
interface HomePageProps {
  headline: string;
  tagline: string;
  stats: { label: string; value: string }[];
}

// Fetch data server-side for fast initial load
// Uses browser client suitable for SSR/Server Components in App Router
async function getTopApps(): Promise<App[]> {
  const supabase = createSupabaseBrowserClient();

  // Fetch from YOUR 'Referstore' table
  const { data, error } = await supabase
    .from('Referstore')
    .select('*')
    .limit(7); // Fetch only top 7 for homepage

  if (error || !data || data.length === 0) {
    console.warn('Supabase fetch failed for Homepage, using fallback apps.json:', error?.message);
    try {
      // Ensure fallbackApps is treated as an array of App
      const apps = fallbackApps as App[];
      return apps.slice(0, 7);
    } catch (fallbackError) {
      console.error("Error loading fallback apps:", fallbackError);
      return []; // Return empty array if fallback also fails
    }
  }
  // Ensure data matches the App type, especially numeric fields
  return data.map(app => ({
    ...app,
    referrer_bonus: Number(app.referrer_bonus) || 0,
    referee_bonus: Number(app.referee_bonus) || 0,
  })) as App[];
}

export default async function HomePage(props: Partial<HomePageProps>) {
  const {
    headline = 'QuickEarn - Best Refer and Earn Apps India 2025 | Instant ₹100+ Payouts',
    tagline = "India's fastest referral platform. No waiting, no hassle.",
    stats = [
      { label: 'Payouts Today', value: '₹50,000+' },
      { label: 'Happy Users', value: '10,000+' },
      { label: 'Top Apps', value: '30+' },
    ],
  } = props;

  const topApps = await getTopApps();

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* 1. Hero Section */}
      <section className="text-center py-12 md:py-20">
        <h1 className="text-gray-900">{headline}</h1>
        <p className="text-lg md:text-xl mt-4 max-w-2xl mx-auto">{tagline}</p>
        <div className="flex justify-center gap-4 mt-8">
          {/* Link this button to categories or quiz later */}
          <button className="btn btn-primary btn-wide text-lg">
            Start Earning
          </button>
        </div>
      </section>

      {/* 2. Social Proof / Stats */}
      <div className="stats stats-vertical md:stats-horizontal shadow-lg w-full mb-12 bg-base-100">
        {stats.map((stat) => (
          <div className="stat text-center" key={stat.label}>
            <div className="stat-value text-primary">{stat.value}</div>
            <div className="stat-desc text-lg">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 3. FOMO Banner */}
      <div className="card lg:card-side bg-secondary text-secondary-content shadow-xl mb-12">
        <div className="card-body flex-col md:flex-row justify-between items-center">
          <h2 className="card-title text-2xl md:text-3xl">
            CRED ₹1,000 Bonus Offer! {/* Example Offer */}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-lg">Ends in:</span>
            <FomoTimer durationInHours={48} /> {/* Renders the timer */}
          </div>
        </div>
      </div>

      {/* 4. Top App List */}
      <section className="mb-12">
        <h2 className="text-center mb-8">Top Instant Payout Apps</h2>
        {topApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topApps.map((app) => (
              // Ensure app has a unique identifier, using 'id' if available, otherwise 'name'
              <AppCard key={app.id || app.name} app={app} />
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Could not load apps. Please try again later.</p>
        )}
      </section>
    </div>
  );
}
