import { createSupabaseAdminClient } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';
// import Razorpay from 'razorpay'; // Uncomment if implementing Razorpay

// Pseudo-function for GA4 Server-side logging (Requires Measurement Protocol setup)
async function logGA4Event(payload: any) {
  const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID;
  const GA4_API_SECRET = process.env.GA4_API_SECRET; // Need to add this to .env.local and Vercel

  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    console.warn('GA4 Measurement ID or API Secret not set for server-side event.');
    return;
  }

  try {
    // You'd typically need a client_id associated with the user,
    // or use a generic one for server events.
    const body = {
      client_id: payload.userId || 'server_event_client', // Use userId or a generic ID
      events: [{
        name: payload.name,
        params: payload.params,
      }],
    };

    await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    console.log('GA4 Server Event Sent:', payload.name);
  } catch (error) {
    console.error('Error sending GA4 server event:', error);
  }
}

// This API route is for Admin use ONLY
export async function POST(request: Request) {
  const supabaseAdmin = createSupabaseAdminClient(); // Use Admin client for elevated privileges

  // 1. Get data from the request body
  let clickId: string, userId: string, status: string, appName: string;
  try {
     const body = await request.json();
     clickId = body.clickId;
     userId = body.userId;
     status = body.status;
     appName = body.appName; // Assuming appName is passed for logging/payout notes

     if (!clickId || !userId || !status || !['confirmed', 'rejected'].includes(status)) {
         throw new Error("Missing or invalid parameters: clickId, userId, appName, and status ('confirmed' or 'rejected') are required.");
     }
  } catch (e: any) {
      return NextResponse.json({ error: `Invalid request body: ${e.message}` }, { status: 400 });
  }


  // 2. CRITICAL: Authenticate the Admin Request
  // This uses a secret key stored ONLY on the server (Vercel env var)
  const authHeader = request.headers.get('Authorization');
  const adminApiKey = process.env.ADMIN_API_KEY; // Needs to be set in Vercel/ .env.local

  if (!adminApiKey) {
    console.error("ADMIN_API_KEY is not set on the server.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${adminApiKey}`) {
    console.warn("Unauthorized attempt to access sync-rewards API.");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 3. Update the click status in your 'referral_clicks' table
    // Your SQL trigger 'trg_update_rewards' will automatically handle crediting the user's balance
    const { data: updatedClick, error: updateError } = await supabaseAdmin
      .from('referral_clicks')
      .update({ status: status })
      .eq('id', clickId)
      .eq('user_id', userId) // Ensure we update the correct user's click
      .select()
      .single();

    if (updateError) {
        console.error("Supabase update error:", updateError);
        // Check for specific errors like 'click not found' if needed
        if (updateError.code === 'PGRST116') { // code for no rows returned from single()
             return NextResponse.json({ error: `Click not found for id: ${clickId} and user: ${userId}` }, { status: 404 });
        }
        throw updateError;
    }
    if (!updatedClick) { // Should be caught by PGRST116, but double-check
        return NextResponse.json({ error: `Click not found for id: ${clickId} and user: ${userId}` }, { status: 404 });
    }

    console.log(`Updated click ${clickId} status to ${status}`);

    // 4. Log GA4 server-side event
    await logGA4Event({
      name: 'referral_sync',
      userId: userId, // Pass userId for GA4 User-ID tracking if configured
      params: {
          click_id: clickId,
          user_id_param: userId, // Use a custom parameter name if needed
          referral_status: status,
          app_name: appName || updatedClick.app || 'Unknown App', // Use provided name or fallback
          // Add other relevant parameters like value if available
      },
    });

    // 5. Check for Payout (if status is 'confirmed')
    // Your SQL trigger already updated the user's balance.
    // Now, we check if that balance is high enough to pay out.
    let payoutMessage = "";
    if (status === 'confirmed') {
      const { data: rewardData, error: rewardError } = await supabaseAdmin
        .from('rewards') // Ensure this table exists
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (rewardError) {
          console.error("Error fetching reward balance:", rewardError);
          // Don't fail the whole request, but log the error
          payoutMessage = "Could not verify balance for payout.";
      } else if (rewardData && rewardData.balance >= 100) { // Check if balance meets minimum payout (e.g., ₹100)
        console.log(`User ${userId} balance is ${rewardData.balance}, attempting payout.`);
        // A. Get user's UPI ID from auth metadata
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
        const upiId = userData?.user?.user_metadata?.upi_id;

        if (userError || !upiId) {
          console.warn(`Payout check failed for user ${userId}: UPI ID not found or error fetching user.`, userError);
          payoutMessage = "Reward credited, but payout failed: UPI ID not found on user profile.";
        } else {
          // B. TODO: Implement Actual Razorpay Payout (Server-side)
          // Requires RazorpayX setup, creating Contacts & Fund Accounts first.
          console.log(`PAYOUT INITIATION (Simulation): Paying ₹${rewardData.balance} to UPI ID: ${upiId} for user ${userId}.`);
          payoutMessage = `Reward credited. Payout of ₹${rewardData.balance} to ${upiId} would be initiated.`;

          /* // Example Razorpay Payout Call (Conceptual - Requires Setup)
          try {
            const razorpay = new Razorpay({
              key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!, // Key ID might be needed? Check Razorpay docs
              key_secret: process.env.RAZORPAY_KEY_SECRET!,
            });

            // 1. Find or Create Razorpay Contact for the user
            // 2. Find or Create Fund Account (UPI) for the user's UPI ID linked to the Contact
            // 3. Initiate Payout
            const payout = await razorpay.payouts.create({
              account_number: "YOUR_RAZORPAYX_ACCOUNT_NUMBER", // Your business account number
              fund_account_id: "fa_user_fund_account_id", // The Fund Account ID for the user's UPI
              amount: rewardData.balance * 100, // Amount in paise
              currency: "INR",
              mode: "UPI",
              purpose: "payout", // Should be 'payout' or 'refund' etc.
              queue_if_low_balance: true,
              reference_id: `QUICKEARN-PAYOUT-${userId}-${Date.now()}`, // Unique reference
              narration: `QuickEarn reward payout for ${appName || updatedClick.app}`,
              notes: {
                userId: userId,
                clickId: clickId,
                appName: appName || updatedClick.app,
              },
            });

            // 4. TODO: Update 'rewards' table: Subtract payout amount from balance
            await supabaseAdmin.from('rewards').update({ balance: rewardData.balance - (payout.amount / 100) }).eq('user_id', userId);

            // 5. TODO: Log payout attempt/success in a separate 'payout_history' table
            //    (Include payout.id, status, amount, userId, timestamp)
            console.log(`Razorpay payout initiated: ${payout.id}`);
            payoutMessage = `Reward credited and payout initiated (ID: ${payout.id}).`;

          } catch (razorpayError: any) {
              console.error("Razorpay Payout Error:", razorpayError);
              payoutMessage = `Reward credited, but Razorpay payout failed: ${razorpayError.description || razorpayError.message}`;
              // TODO: Log payout failure in 'payout_history' table
          }
          */
        }
      } else if (rewardData) {
          payoutMessage = `Reward credited. Balance (₹${rewardData.balance}) is below payout threshold (₹100).`;
      } else {
          // Case where rewards record might not exist yet, even if click is confirmed
          payoutMessage = "Reward credited. User reward record not found or balance is zero.";
      }
    }

    // Return success message, including any payout info
    return NextResponse.json({ message: `Click status updated to ${status}. ${payoutMessage}`.trim() });

  } catch (error: any) {
    console.error(`Error in sync-rewards API: ${error.message}`, error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message}` }, { status: 500 });
  }
}

