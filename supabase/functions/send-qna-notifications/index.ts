import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const brevoApiKey = Deno.env.get("BREVO_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailData {
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  sender: { email: string; name: string };
}

// Get the base URL for the application
const getBaseUrl = (): string => {
  const isProduction = supabaseUrl.includes("zyxiznikuvpwmopraauj");
  if (isProduction) {
    return "https://tesviksor.com";
  }
  return "https://efd7e70c-3a69-4fb9-a26d-55aefb24b4b1.lovable.app";
};

// Enhanced mobile-compatible token generation and verification
export interface YdoTokenPayload {
  email: string;
  province: string;
  exp: number;
  iat: number;
}

// Simple token generation for YDO access - Fixed to handle UTF-8 characters
const generateYdoToken = (email: string, province: string): string => {
  const payload = {
    email,
    province,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    iat: Math.floor(Date.now() / 1000),
  };

  // Convert to UTF-8 bytes then base64 encode properly
  const jsonString = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);

  // Use Deno's built-in base64 encoding which handles UTF-8 properly
  return btoa(String.fromCharCode(...data));
};

// Safe token verification function
const verifyYdoToken = (token: string): YdoTokenPayload | null => {
  try {
    // Normalize URL-safe Base64 (- → +, _ → /)
    let base64 = token.replace(/-/g, "+").replace(/_/g, "/");

    // Add padding (=) to make it a multiple of 4
    base64 += "=".repeat((4 - (base64.length % 4)) % 4);

    // Decode to binary string
    const binaryStr = atob(base64);

    // Convert to Uint8Array
    const bytes = Uint8Array.from(binaryStr, (c) => c.charCodeAt(0));

    // Use TextDecoder for safe UTF-8 decoding
    const jsonStr = new TextDecoder("utf-8").decode(bytes);

    // Parse JSON
    const payload = JSON.parse(jsonStr) as YdoTokenPayload;

    // Check expiration
    const currentTime = Math.floor(Date.now() / 1000);
    if (payload.exp < currentTime) {
      console.error("Token expired");
      return null;
    }

    // Validate required fields
    if (!payload.email || !payload.province) {
      console.error("Missing required fields");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
};

// Enhanced email logging function
const logEmailTransaction = async (
  emailData: {
    soru_cevap_id?: string;
    sent_page: string;
    sender_email: string;
    recipient_email: string;
    email_subject: string;
    email_type: string;
  },
  success: boolean,
  errorMessage?: string,
) => {
  try {
    console.log("📧 Logging email transaction:", emailData);

    const logEntry = {
      soru_cevap_id: emailData.soru_cevap_id || null,
      sent_page: emailData.sent_page,
      sender_email: emailData.sender_email,
      recipient_email: emailData.recipient_email,
      sent_date: new Date().toISOString(),
      email_subject: emailData.email_subject,
      transmission_status: success ? "sent" : "failed",
      error_message: errorMessage || null,
      email_type: emailData.email_type,
    };

    const { error } = await supabase.from("qna_email_logs").insert([logEntry]);

    if (error) {
      console.error("❌ Failed to log email transaction:", error);
    } else {
      console.log("✅ Email transaction logged successfully");
    }
  } catch (error) {
    console.error("❌ Error in logEmailTransaction:", error);
  }
};

const sendBrevoEmail = async (emailData: EmailData, logData: any) => {
  try {
    console.log("📤 Sending email via Brevo:", emailData.subject);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Brevo API error:", error);

      // Log failed email for each recipient
      for (const recipient of emailData.to) {
        await logEmailTransaction(
          {
            ...logData,
            recipient_email: recipient.email,
          },
          false,
          `Brevo API error: ${response.status} - ${error}`,
        );
      }

      throw new Error(`Brevo API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Email sent successfully via Brevo");

    // Log successful email for each recipient
    for (const recipient of emailData.to) {
      await logEmailTransaction(
        {
          ...logData,
          recipient_email: recipient.email,
        },
        true,
      );
    }

    return result;
  } catch (error) {
    console.error("❌ Error in sendBrevoEmail:", error);

    // Log failed email for each recipient if not already logged
    for (const recipient of emailData.to) {
      await logEmailTransaction(
        {
          ...logData,
          recipient_email: recipient.email,
        },
        false,
        (error as Error).message,
      );
    }

    throw error;
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, questionId, questionData, token } = await req.json();
    console.log("🔔 Processing notification:", { type, questionId });

    // Handle YDO question fetching with enhanced Turkish character support
    if (type === "fetch_ydo_questions") {
      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the YDO token
      const tokenPayload = verifyYdoToken(token);
      if (!tokenPayload) {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("🔍 Fetching questions for province:", tokenPayload.province);

      // Enhanced query with better Turkish character handling
      let query = supabase.from("soru_cevap").select("*").order("created_at", { ascending: false });

      // Use exact match for province - this should handle Turkish characters correctly
      query = query.eq("province", tokenPayload.province);

      const { data: questions, error } = await query;

      if (error) {
        console.error("❌ Error fetching questions:", error);
        return new Response(JSON.stringify({ error: "Failed to fetch questions" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`✅ Found ${questions?.length || 0} questions for province: "${tokenPayload.province}"`);

      // Process and normalize text fields to handle Turkish characters
      const processedQuestions = (questions || []).map((question) => ({
        ...question,
        question: question.question || "",
        answer: question.answer || "",
        full_name: question.full_name || "",
        email: question.email || "",
        province: question.province || "",
        phone: question.phone || "",
        return_reason: question.return_reason || "",
        admin_notes: question.admin_notes || "",
      }));

      return new Response(JSON.stringify({ success: true, questions: processedQuestions }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle YDO answer submission
    if (type === "submit_ydo_answer") {
      if (!token) {
        return new Response(JSON.stringify({ error: "Token required" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenPayload = verifyYdoToken(token);
      if (!tokenPayload) {
        return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { questionId, answer, isCorrection, ydoFullName } = questionData;

      const newStatus = isCorrection ? "corrected" : "answered";
      const updateData: any = {
        answer: answer.trim(),
        answered: true,
        answer_date: new Date().toISOString(),
        answer_status: newStatus,
        admin_sent: false,
        answered_by_full_name: ydoFullName?.trim() || null,
      };

      // Set return_status when it's a correction
      if (isCorrection) {
        updateData.return_status = "corrected";
      }

      const { error: updateError } = await supabase.from("soru_cevap").update(updateData).eq("id", questionId);

      if (updateError) {
        console.error("❌ Error updating question:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update question" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Send notification to admins about the answer
      const { error: notificationError } = await supabase.functions.invoke("send-qna-notifications", {
        body: {
          type: isCorrection ? "answer_corrected" : "answer_provided",
          questionData: {
            ...questionData,
            answer: answer.trim(),
            answer_status: newStatus,
          },
        },
      });

      if (notificationError) {
        console.error("❌ Error sending notification:", notificationError);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "submit_question") {
      const { data, error } = await supabase
        .from("soru_cevap")
        .insert([
          {
            full_name: questionData.full_name,
            email: questionData.email,
            phone: questionData.phone,
            province: questionData.province,
            question: questionData.question,
            answer_status: "unanswered",
            sent_to_ydo: true,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("❌ Error inserting question:", error);
        throw error;
      }

      await sendNewQuestionNotifications(data);

      return new Response(JSON.stringify({ success: true, question: data }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "new_question") {
      await sendNewQuestionNotifications(questionData);
    }

    if (type === "answer_sent") {
      const emailData: EmailData = {
        to: [{ email: questionData.email, name: questionData.full_name }],
        subject: "Sorunuza Yanıt Geldi - YatırımaDestek",
        htmlContent: `
          <h2>Sorunuz Yanıtlandı</h2>
          <p>Merhaba ${questionData.full_name},</p>
          <p>Göndermiş olduğunuz soru yanıtlanmıştır:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Sorunuz:</h3>
            <p>${questionData.question.replace(/\n/g, "<br>")}</p>
          </div>

          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Yanıt:</h3>
            <p>${questionData.answer.replace(/\n/g, "<br>")}</p>
          </div>

          <p>Bu yanıt size yardımcı olduysa, başka sorularınız için de YatırımaDestek'i kullanabilirsiniz.</p>
          <p>İyi günler dileriz,<br>YatırımaDestek Ekibi</p>
        `,
        sender: { email: "noreply@tesviksor.com", name: "YatırımaDestek" },
      };

      await sendBrevoEmail(emailData, {
        soru_cevap_id: questionData.id,
        sent_page: "Admin Panel",
        sender_email: "noreply@tesviksor.com",
        email_subject: emailData.subject,
        email_type: "answer_sent",
      });

      console.log("✅ Answer notification sent to user:", questionData.email);
    }

    if (type === "answer_returned") {
      const baseUrl = getBaseUrl();

      const { data: ydoUsers, error: ydoError } = await supabase
        .from("ydo_users")
        .select("email, full_name")
        .eq("province", questionData.province);

      if (ydoError) {
        console.error("❌ Error fetching YDO users:", ydoError);
        throw ydoError;
      }

      if (ydoUsers && ydoUsers.length > 0) {
        for (const ydoUser of ydoUsers) {
          const token = generateYdoToken(ydoUser.email, questionData.province);
          const secureAccessUrl = `${baseUrl}/ydo/secure-access?token=${token}`;

          const emailData: EmailData = {
            to: [{ email: ydoUser.email, name: ydoUser.full_name }],
            subject: `Yanıt İade Edildi - ${questionData.province} - YatırımaDestek`,
            htmlContent: `
              <h2>Yanıtınız İade Edildi</h2>
              <p>Merhaba ${ydoUser.full_name},</p>
              <p>Vermiş olduğunuz yanıt admin tarafından iade edilmiştir:</p>
              
              <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
                <h3>İade Sebebi:</h3>
                <p>${questionData.return_reason}</p>
              </div>

              <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                <h3>Soru:</h3>
                <p>${questionData.question.substring(0, 200)}${questionData.question.length > 200 ? "..." : ""}</p>
              </div>
              
              <div style="margin: 20px 0; text-align: center;">
                <a href="${secureAccessUrl}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Yanıtı Düzelt
                </a>
              </div>
              
              <p><small>Bu bağlantı 24 saat geçerlidir.</small></p>
              <p>Saygılarımızla,<br>YatırımaDestek Ekibi</p>
            `,
            sender: { email: "noreply@tesviksor.com", name: "TeşvikSor" },
          };

          await sendBrevoEmail(emailData, {
            soru_cevap_id: questionData.id,
            sent_page: "Admin Panel",
            sender_email: "noreply@tesviksor.com",
            email_subject: emailData.subject,
            email_type: "answer_returned",
          });
        }
        console.log(
          `✅ Return notification sent to ${ydoUsers.length} YDO users for province: ${questionData.province}`,
        );
      }
    }

    if (type === "answer_provided" || type === "answer_corrected") {
      const baseUrl = getBaseUrl();
      const adminPanelUrl = `${baseUrl}/admin/qa-management`;

      const { data: adminEmails, error: adminError } = await supabase
        .from("qna_admin_emails")
        .select("email, full_name")
        .eq("is_active", true);

      if (adminError) {
        console.error("❌ Error fetching admin emails:", adminError);
      }

      if (adminEmails && adminEmails.length > 0) {
        const isCorrection = type === "answer_corrected";
        const subject = `${isCorrection ? "Yanıt Düzeltildi" : "Yeni Yanıt"}: ${questionData.province} - TeşvikSor`;

        const adminEmailData: EmailData = {
          to: adminEmails.map((admin) => ({ email: admin.email, name: admin.full_name })),
          subject: subject,
          htmlContent: `
            <h2>${isCorrection ? "Yanıt Düzeltildi" : "Yeni Yanıt Geldi"}</h2>
            <p><strong>Soru Sahibi:</strong> ${questionData.full_name}</p>
            <p><strong>E-posta:</strong> ${questionData.email}</p>
            <p><strong>İl:</strong> ${questionData.province}</p>
            
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>Soru:</h3>
              <p>${questionData.question.substring(0, 200)}${questionData.question.length > 200 ? "..." : ""}</p>
            </div>

            <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3>${isCorrection ? "Düzeltilmiş Yanıt" : "Yanıt"}:</h3>
              <p>${questionData.answer.substring(0, 300)}${questionData.answer.length > 300 ? "..." : ""}</p>
            </div>
            
            <div style="margin: 20px 0; text-align: center;">
              <a href="${adminPanelUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Admin Paneli - Yanıtı İncele
              </a>
            </div>

            <p>${isCorrection ? "Yanıt düzeltilmiştir ve onayınızı beklemektedir." : "Yanıt onayınızı beklemektedir."}</p>
          `,
          sender: { email: "noreply@tesviksor.com", name: "YatırımaDestek" },
        };

        await sendBrevoEmail(adminEmailData, {
          soru_cevap_id: questionData.id,
          sent_page: "YDO Panel",
          sender_email: "noreply@tesviksor.com",
          email_subject: adminEmailData.subject,
          email_type: isCorrection ? "answer_corrected" : "answer_provided",
        });

        console.log(`✅ ${isCorrection ? "Correction" : "Answer"} notification sent to ${adminEmails.length} admins`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Error in send-qna-notifications:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

const sendNewQuestionNotifications = async (questionData: any) => {
  const baseUrl = getBaseUrl();

  // Get YDO users for the province
  const { data: ydoUsers, error: ydoError } = await supabase
    .from("ydo_users")
    .select("email, full_name")
    .eq("province", questionData.province);

  if (ydoError) {
    console.error("❌ Error fetching YDO users:", ydoError);
  }

  // Get admin emails
  const { data: adminEmails, error: adminError } = await supabase
    .from("qna_admin_emails")
    .select("email, full_name")
    .eq("is_active", true);

  if (adminError) {
    console.error("❌ Error fetching admin emails:", adminError);
  }

  // Send secure access links to YDO users
  if (ydoUsers && ydoUsers.length > 0) {
    for (const ydoUser of ydoUsers) {
      const token = generateYdoToken(ydoUser.email, questionData.province);
      const secureAccessUrl = `${baseUrl}/ydo/secure-access?token=${token}`;

      const ydoEmailData: EmailData = {
        to: [{ email: ydoUser.email, name: ydoUser.full_name }],
        subject: `Yeni Soru: ${questionData.province} - Güvenli Erişim`,
        htmlContent: `
          <h2>Yeni Soru Geldi - ${questionData.province}</h2>
          <p>Merhaba ${ydoUser.full_name},</p>
          <p>${questionData.province} ili için yeni bir soru gelmiştir. Aşağıdaki güvenli bağlantıdan sorulara erişebilir ve yanıtlayabilirsiniz:</p>
          
          <div style="margin: 20px 0; text-align: center;">
            <a href="${secureAccessUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Güvenli Erişim - Soruları Yanıtla
            </a>
          </div>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Soru Özeti:</h3>
            <p><strong>Gönderen:</strong> ${questionData.full_name}</p>
            <p><strong>E-posta:</strong> ${questionData.email}</p>
            <p><strong>Soru:</strong> ${questionData.question.substring(0, 200)}${questionData.question.length > 200 ? "..." : ""}</p>
          </div>
          
          <p><small>Bu bağlantı 24 saat geçerlidir. Güvenlik nedeniyle bağlantıyı başkalarıyla paylaşmayınız.</small></p>
          <p>Saygılarımızla,<br>YatırımaDestek Ekibi</p>
        `,
        sender: { email: "noreply@tesviksor.com", name: "TeşvikSor" },
      };

      await sendBrevoEmail(ydoEmailData, {
        soru_cevap_id: questionData.id,
        sent_page: "Soru & Cevap Sayfası",
        sender_email: "noreply@tesviksor.com",
        email_subject: ydoEmailData.subject,
        email_type: "new_question",
      });
    }
    console.log(`✅ Secure access notifications sent to ${ydoUsers.length} YDO users`);
  }

  // Send regular notifications to admins
  if (adminEmails && adminEmails.length > 0) {
    const adminPanelUrl = `${baseUrl}/admin/qa-management`;

    const adminEmailData: EmailData = {
      to: adminEmails.map((admin) => ({ email: admin.email, name: admin.full_name })),
      subject: `Yeni Soru: ${questionData.province} - ${questionData.full_name}`,
      htmlContent: `
        <h2>Yeni Soru Geldi</h2>
        <p><strong>Gönderen:</strong> ${questionData.full_name}</p>
        <p><strong>E-posta:</strong> ${questionData.email}</p>
        <p><strong>Telefon:</strong> ${questionData.phone || "Belirtilmemiş"}</p>
        <p><strong>İl:</strong> ${questionData.province}</p>
        <p><strong>Soru:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${questionData.question.replace(/\n/g, "<br>")}
        </div>
        <p><strong>Gönderilme Tarihi:</strong> ${new Date(questionData.created_at || new Date()).toLocaleString("tr-TR")}</p>
        
        <div style="margin: 20px 0; text-align: center;">
          <a href="${adminPanelUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Admin Paneli - Soru Yönetimi
          </a>
        </div>
      `,
      sender: { email: "noreply@tesviksor.com", name: "YatırımaDestek" },
    };

    await sendBrevoEmail(adminEmailData, {
      soru_cevap_id: questionData.id,
      sent_page: "Soru & Cevap Sayfası",
      sender_email: "noreply@tesviksor.com",
      email_subject: adminEmailData.subject,
      email_type: "new_question",
    });

    console.log(`✅ Admin notification sent to ${adminEmails.length} admins`);
  }
};

serve(handler);
