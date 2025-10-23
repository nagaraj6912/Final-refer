'use client'

import Script from 'next/script'

export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;

  // Only load GA4 if the ID is set in environment variables
  if (!gaId) {
    console.warn("GA4 Measurement ID (NEXT_PUBLIC_GA4_MEASUREMENT_ID) is not set. Analytics disabled.");
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            // TODO: Add consent management check here before configuring
            gtag('config', '${gaId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}
