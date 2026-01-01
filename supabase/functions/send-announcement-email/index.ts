import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnnouncementEmailRequest {
  announcementId: string;
}

interface BrevoEmailPayload {
  sender: { name: string; email: string };
  to: { email: string; name?: string }[];
  subject: string;
  htmlContent: string;
}

async function sendBrevoEmail(payload: BrevoEmailPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const brevoApiKey = Deno.env.get("BREVO_API_KEY");
  if (!brevoApiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": brevoApiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[Brevo] Email send failed:", result);
      return { success: false, error: result.message || "Failed to send email" };
    }

    console.log("[Brevo] Email sent successfully:", result);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("[Brevo] Error sending email:", error);
    return { success: false, error: error.message };
  }
}

function generateEmailHtml(announcement: any, subscriberName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #003D82; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">YatırımaDestek Platformu</h1>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <p style="color: #666; margin-bottom: 10px;">Sayın ${subscriberName},</p>
          <h2 style="color: #003D82; margin-bottom: 15px;">${announcement.title}</h2>
          <div style="color: #333; line-height: 1.6; margin-bottom: 20px;">
            ${announcement.detail}
          </div>
          <p style="color: #888; font-size: 14px;">
            <strong>Kurum:</strong> ${announcement.institution_name}<br>
            <strong>Tarih:</strong> ${new Date(announcement.announcement_date).toLocaleDateString("tr-TR")}
          </p>
          ${announcement.external_link ? `
            <div style="margin-top: 20px; text-align: center;">
              <a href="${announcement.external_link}" style="display: inline-block; background-color: #003D82; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Detayları Görüntüle
              </a>
            </div>
          ` : ""}
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            Bu e-postayı ${announcement.institution_name} duyurularını takip ettiğiniz için aldınız.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log(`[send-announcement-email] Announcement: ${announcement.title}, Institution: ${announcement.institution_name}`);

    // Find institution ID by name
    const { data: institution } = await supabase
      .from("institutions")
      .select("id")
      .eq("name", announcement.institution_name)
      .single();

    if (!institution) {
      console.log(`[send-announcement-email] Institution not found: ${announcement.institution_name}`);
      return new Response(
        JSON.stringify({ success: true, message: "Kurum bulunamadı - e-posta gönderilmedi", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get subscribers who have selected this institution
    const { data: preferences } = await supabase
      .from("bulten_uye_kurum_tercihleri")
      .select("uye_id")
      .eq("institution_id", institution.id);

    const subscriberIds = (preferences || []).map((p) => p.uye_id);

    if (subscriberIds.length === 0) {
      console.log("[send-announcement-email] No subscribers for this institution");
      return new Response(
        JSON.stringify({ success: true, message: "Bu kurumu tercih eden üye yok", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch active subscribers who prefer this institution
    const { data: subscribers, error: subscribersError } = await supabase
      .from("bulten_uyeler")
      .select("id, email, ad_soyad")
      .eq("is_active", true)
      .in("id", subscriberIds);

    if (subscribersError) {
      throw new Error("Failed to fetch subscribers");
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Bu kurumu tercih eden aktif üye bulunamadı", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`[send-announcement-email] Sending to ${subscribers.length} subscribers who prefer ${announcement.institution_name}`);

    // Send emails to all subscribers using Brevo
    const emailPromises = subscribers.map(async (subscriber) => {
      try {
        const htmlContent = generateEmailHtml(announcement, subscriber.ad_soyad);
        
        const result = await sendBrevoEmail({
          sender: { name: "YatırımaDestek Platformu", email: "noreply@tesviksor.com" },
          to: [{ email: subscriber.email, name: subscriber.ad_soyad }],
          subject: `📢 ${announcement.title}`,
          htmlContent,
        });

        if (result.success) {
          return { success: true, email: subscriber.email };
        } else {
          console.error(`Failed to send to ${subscriber.email}:`, result.error);
          return { success: false, email: subscriber.email, error: result.error };
        }
      } catch (error) {
        console.error(`Failed to send to ${subscriber.email}:`, error);
        return { success: false, email: subscriber.email, error };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    // Log the email send
    const authHeader = req.headers.get("Authorization");
    let userId = null;
    if (authHeader) {
      const userSupabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await userSupabase.auth.getUser();
      userId = user?.id;
    }

    await supabase.from("announcement_email_logs").insert({
      announcement_id: announcementId,
      sent_by: userId,
      recipient_count: successCount,
      status: failCount === 0 ? "sent" : "partial",
    });

    console.log(`[send-announcement-email] Email sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        failed: failCount,
        message: `${successCount} üyeye e-posta gönderildi`,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("[send-announcement-email] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
