import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
  resetUrl: string;
}

async function sendEmail(to: string, subject: string, html: string) {
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
    throw new Error(`Resend API error: ${res.status} - ${errorText}`);
  }
  
  return res.json();
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, resetUrl }: PasswordResetRequest = await req.json();

    if (!email || !resetUrl) {
      throw new Error("Missing required fields: email and resetUrl");
    }

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
              <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px;">
                <!-- Logo -->
                <tr>
                  <td align="center" style="padding-bottom: 30px;">
                    <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #8b5cf6, #a855f7); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="color: white; font-weight: bold; font-size: 24px;">UV</span>
                    </div>
                    <h1 style="color: #ffffff; margin: 20px 0 0 0; font-size: 28px; font-weight: 700;">UserVault</h1>
                  </td>
                </tr>
                
                <!-- Main Card -->
                <tr>
                  <td style="background: linear-gradient(180deg, rgba(139, 92, 246, 0.1) 0%, rgba(0,0,0,0.8) 100%); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 20px; padding: 40px;">
                    <h2 style="color: #ffffff; margin: 0 0 16px 0; font-size: 22px; text-align: center;">
                      Passwort zurücksetzen
                    </h2>
                    <p style="color: #a1a1aa; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6; text-align: center;">
                      Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort zu erstellen.
                    </p>
                    
                    <!-- CTA Button -->
                    <div style="text-align: center; margin-bottom: 30px;">
                      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                        Passwort zurücksetzen
                      </a>
                    </div>
                    
                    <p style="color: #71717a; margin: 0 0 20px 0; font-size: 14px; text-align: center;">
                      Dieser Link ist <strong style="color: #a1a1aa;">1 Stunde</strong> gültig.
                    </p>
                    
                    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px;">
                      <p style="color: #52525b; font-size: 12px; margin: 0; text-align: center;">
                        Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                        <a href="${resetUrl}" style="color: #8b5cf6; word-break: break-all;">${resetUrl}</a>
                      </p>
                    </div>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding-top: 30px; text-align: center;">
                    <p style="color: #52525b; font-size: 12px; margin: 0;">
                      Falls du diese E-Mail nicht angefordert hast, kannst du sie ignorieren.
                    </p>
                    <p style="color: #3f3f46; font-size: 11px; margin: 16px 0 0 0;">
                      © ${new Date().getFullYear()} UserVault. Alle Rechte vorbehalten.
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

    const emailResponse = await sendEmail(email, "Passwort zurücksetzen - UserVault", html);

    console.log("Password reset email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending password reset email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
