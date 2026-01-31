import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PremiumEmailRequest {
  email: string;
  username: string;
  orderId: string;
  amount: string;
  purchaseDate: string;
}

async function sendEmail(to: string, subject: string, html: string) {
  console.log(`Sending premium confirmation email to: ${to}`);
  
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "UserVault <noreply@uservault.cc>",
      to: [to],
      subject,
      html,
    }),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error(`Resend API error: ${res.status} - ${errorText}`);
    throw new Error(`Resend API error: ${res.status} - ${errorText}`);
  }
  
  const result = await res.json();
  console.log("Email sent successfully:", result);
  return result;
}

function generateInvoiceNumber(orderId: string): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const shortId = orderId.substring(0, 8).toUpperCase();
  return `UV-${year}${month}-${shortId}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, username, orderId, amount, purchaseDate }: PremiumEmailRequest = await req.json();

    if (!email || !orderId) {
      console.error('Missing required fields');
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const invoiceNumber = generateInvoiceNumber(orderId);
    const formattedDate = formatDate(purchaseDate);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px;">
                <!-- Logo -->
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td align="center" style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 16px;">
                          <span style="color: white; font-weight: bold; font-size: 24px; line-height: 60px;">UV</span>
                        </td>
                      </tr>
                    </table>
                    <h1 style="color: #ffffff; margin: 20px 0 0 0; font-size: 28px; font-weight: 700; text-align: center;">UserVault</h1>
                  </td>
                </tr>
                
                <!-- Welcome Message -->
                <tr>
                  <td style="background: linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(0,0,0,0.8) 100%); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 20px; padding: 40px;">
                    <h2 style="color: #fbbf24; margin: 0 0 16px 0; font-size: 24px; text-align: center;">
                      🎉 Welcome to Premium!
                    </h2>
                    <p style="color: #a1a1aa; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; text-align: center;">
                      Thank you for your purchase, <strong style="color: #ffffff;">@${username || 'User'}</strong>! Your premium features are now unlocked.
                    </p>
                    
                    <!-- Premium Features -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(0,0,0,0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                      <tr>
                        <td style="padding: 12px;">
                          <p style="color: #fbbf24; font-size: 14px; font-weight: 600; margin: 0 0 12px 0;">YOUR PREMIUM FEATURES:</p>
                          <table cellpadding="0" cellspacing="0" width="100%">
                            <tr><td style="color: #10b981; padding: 4px 0;">✓</td><td style="color: #d1d5db; padding: 4px 8px;">Advanced Themes & Animations</td></tr>
                            <tr><td style="color: #10b981; padding: 4px 0;">✓</td><td style="color: #d1d5db; padding: 4px 8px;">Exclusive Effects & Fonts</td></tr>
                            <tr><td style="color: #10b981; padding: 4px 0;">✓</td><td style="color: #d1d5db; padding: 4px 8px;">Custom Domain for your Profile</td></tr>
                            <tr><td style="color: #10b981; padding: 4px 0;">✓</td><td style="color: #d1d5db; padding: 4px 8px;">Premium Badge on your Profile</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Invoice Section -->
                <tr>
                  <td style="padding-top: 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 30px;">
                      <tr>
                        <td>
                          <h3 style="color: #ffffff; margin: 0 0 20px 0; font-size: 18px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 12px;">
                            📄 Invoice
                          </h3>
                          
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Invoice Number:</td>
                              <td style="color: #ffffff; font-size: 14px; text-align: right; padding: 8px 0; font-family: 'SF Mono', Monaco, monospace;">${invoiceNumber}</td>
                            </tr>
                            <tr>
                              <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Order ID:</td>
                              <td style="color: #a1a1aa; font-size: 12px; text-align: right; padding: 8px 0; font-family: 'SF Mono', Monaco, monospace; word-break: break-all;">${orderId}</td>
                            </tr>
                            <tr>
                              <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Date:</td>
                              <td style="color: #ffffff; font-size: 14px; text-align: right; padding: 8px 0;">${formattedDate}</td>
                            </tr>
                            <tr>
                              <td style="color: #71717a; font-size: 14px; padding: 8px 0;">Payment Method:</td>
                              <td style="color: #ffffff; font-size: 14px; text-align: right; padding: 8px 0;">PayPal</td>
                            </tr>
                          </table>
                          
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                            <tr>
                              <td style="color: #ffffff; font-size: 14px; padding: 8px 0;">UserVault Premium</td>
                              <td style="color: #ffffff; font-size: 14px; text-align: right; padding: 8px 0;">Lifetime</td>
                            </tr>
                            <tr>
                              <td colspan="2" style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 12px; margin-top: 12px;"></td>
                            </tr>
                            <tr>
                              <td style="color: #fbbf24; font-size: 18px; font-weight: 700; padding: 8px 0;">Total Paid:</td>
                              <td style="color: #fbbf24; font-size: 18px; font-weight: 700; text-align: right; padding: 8px 0;">€${amount}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding-top: 30px;">
                    <a href="https://uservault.cc/dashboard" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000000; font-weight: 600; font-size: 16px; padding: 14px 32px; border-radius: 12px; text-decoration: none;">
                      Go to Dashboard
                    </a>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding-top: 40px; text-align: center;">
                    <p style="color: #52525b; font-size: 12px; margin: 0;">
                      Thank you for supporting UserVault!
                    </p>
                    <p style="color: #3f3f46; font-size: 11px; margin: 16px 0 0 0;">
                      © ${new Date().getFullYear()} UserVault. All rights reserved.
                    </p>
                    <p style="color: #3f3f46; font-size: 11px; margin: 8px 0 0 0;">
                      Questions? Contact us at support@uservault.cc
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    await sendEmail(email, `🎉 Premium Activated - Invoice ${invoiceNumber}`, html);

    return new Response(
      JSON.stringify({ success: true, invoiceNumber }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error sending premium email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
