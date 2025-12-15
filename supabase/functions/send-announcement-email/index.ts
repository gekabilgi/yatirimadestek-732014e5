import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnnouncementEmailRequest {
  announcementId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(resendApiKey);
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { announcementId }: AnnouncementEmailRequest = await req.json();

    // Fetch the announcement
    const { data: announcement, error: announcementError } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", announcementId)
      .single();

    if (announcementError || !announcement) {
      throw new Error("Announcement not found");
    }

    // Fetch active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from("bulten_uyeler")
      .select("email, ad, soyad")
      .eq("is_active", true);

    if (subscribersError) {
      throw new Error("Failed to fetch subscribers");
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No active subscribers found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending announcement to ${subscribers.length} subscribers`);

    // Send emails to all subscribers
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        await resend.emails.send({
          from: "Teşvik Platformu <onboarding@resend.dev>",
          to: [subscriber.email],
          subject: `📢 ${announcement.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #003D82; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">Teşvik Platformu</h1>
                </div>
                <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <p style="color: #666; margin-bottom: 10px;">Sayın ${subscriber.ad} ${subscriber.soyad},</p>
                  <h2 style="color: #003D82; margin-bottom: 15px;">${announcement.title}</h2>
                  <div style="color: #333; line-height: 1.6; margin-bottom: 20px;">
                    ${announcement.detail}
                  </div>
                  <p style="color: #888; font-size: 14px;">
                    <strong>Kurum:</strong> ${announcement.institution_name}<br>
                    <strong>Tarih:</strong> ${new Date(announcement.announcement_date).toLocaleDateString('tr-TR')}
                  </p>
                  ${announcement.external_link ? `
                    <div style="margin-top: 20px; text-align: center;">
                      <a href="${announcement.external_link}" style="display: inline-block; background-color: #003D82; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                        Detayları Görüntüle
                      </a>
                    </div>
                  ` : ''}
                  <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                  <p style="color: #999; font-size: 12px; text-align: center;">
                    Bu e-postayı Teşvik Platformu bültenine abone olduğunuz için aldınız.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
        return { success: true, email: subscriber.email };
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        return { success: false, email: subscriber.email, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    // Log the email send
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } }
      });
      const { data: { user } } = await userSupabase.auth.getUser();
      userId = user?.id;
    }

    await supabase.from("announcement_email_logs").insert({
      announcement_id: announcementId,
      sent_by: userId,
      recipient_count: successCount,
      status: failCount === 0 ? 'sent' : 'partial'
    });

    console.log(`Email sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        failed: failCount,
        message: `${successCount} üyeye e-posta gönderildi` 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-announcement-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
