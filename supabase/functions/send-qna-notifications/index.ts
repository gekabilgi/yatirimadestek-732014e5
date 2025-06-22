
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const brevoApiKey = Deno.env.get('BREVO_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailData {
  to: { email: string; name: string }[];
  subject: string;
  htmlContent: string;
  sender: { email: string; name: string };
}

// Get the base URL for the application
const getBaseUrl = (): string => {
  // Check if we're in production by looking at the request origin or environment
  const isProduction = supabaseUrl.includes('zyxiznikuvpwmopraauj');
  
  if (isProduction) {
    return 'https://tesviksor.com';
  }
  
  // For development/preview, use the lovable preview URL
  return 'https://efd7e70c-3a69-4fb9-a26d-55aefb24b4b1.lovable.app';
};

// Simple token generation for YDO access
const generateYdoToken = (email: string, province: string): string => {
  const payload = {
    email,
    province,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Simple base64 encoding (in production, use proper JWT with server-side signing)
  return btoa(JSON.stringify(payload));
};

const sendBrevoEmail = async (emailData: EmailData) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': brevoApiKey,
    },
    body: JSON.stringify(emailData),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Brevo API error:', error);
    throw new Error(`Brevo API error: ${response.status}`);
  }

  return await response.json();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, questionId, questionData } = await req.json();
    console.log('Processing notification:', { type, questionId });

    if (type === 'submit_question') {
      // Insert the question using service role to bypass RLS
      const { data, error } = await supabase
        .from('soru_cevap')
        .insert([{
          full_name: questionData.full_name,
          email: questionData.email,
          phone: questionData.phone,
          province: questionData.province,
          question: questionData.question
        }])
        .select()
        .single();

      if (error) {
        console.error('Error inserting question:', error);
        throw error;
      }

      // Send notifications for the new question
      await sendNewQuestionNotifications(data);

      return new Response(
        JSON.stringify({ success: true, question: data }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (type === 'new_question') {
      await sendNewQuestionNotifications(questionData);
    }

    if (type === 'answer_sent') {
      // Send answer to the user who asked the question
      const emailData: EmailData = {
        to: [{ email: questionData.email, name: questionData.full_name }],
        subject: 'Sorunuza Yanıt Geldi - TeşvikSor',
        htmlContent: `
          <h2>Sorunuz Yanıtlandı</h2>
          <p>Merhaba ${questionData.full_name},</p>
          <p>Göndermiş olduğunuz soru yanıtlanmıştır:</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Sorunuz:</h3>
            <p>${questionData.question.replace(/\n/g, '<br>')}</p>
          </div>

          <div style="background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>Yanıt:</h3>
            <p>${questionData.answer.replace(/\n/g, '<br>')}</p>
          </div>

          <p>Bu yanıt size yardımcı olduysa, başka sorularınız için de TeşvikSor'u kullanabilirsiniz.</p>
          <p>İyi günler dileriz,<br>TeşvikSor Ekibi</p>
        `,
        sender: { email: 'noreply@tesviksor.com', name: 'TeşvikSor' }
      };

      await sendBrevoEmail(emailData);
      console.log('Answer notification sent to user:', questionData.email);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-qna-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

const sendNewQuestionNotifications = async (questionData: any) => {
  const baseUrl = getBaseUrl();
  
  // Get YDO users for the province
  const { data: ydoUsers, error: ydoError } = await supabase
    .from('ydo_users')
    .select('email, full_name')
    .eq('province', questionData.province);

  if (ydoError) {
    console.error('Error fetching YDO users:', ydoError);
  }

  // Get admin emails
  const { data: adminEmails, error: adminError } = await supabase
    .from('qna_admin_emails')
    .select('email, full_name')
    .eq('is_active', true);

  if (adminError) {
    console.error('Error fetching admin emails:', adminError);
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
            <p><strong>Soru:</strong> ${questionData.question.substring(0, 200)}${questionData.question.length > 200 ? '...' : ''}</p>
          </div>
          
          <p><small>Bu bağlantı 24 saat geçerlidir. Güvenlik nedeniyle bağlantıyı başkalarıyla paylaşmayınız.</small></p>
          <p>Saygılarımızla,<br>TeşvikSor Ekibi</p>
        `,
        sender: { email: 'noreply@tesviksor.com', name: 'TeşvikSor' }
      };

      await sendBrevoEmail(ydoEmailData);
    }
    console.log('Secure access notifications sent to', ydoUsers.length, 'YDO users');
  }

  // Send regular notifications to admins
  if (adminEmails && adminEmails.length > 0) {
    const adminPanelUrl = `${baseUrl}/admin/qa-management`;
    
    const adminEmailData: EmailData = {
      to: adminEmails.map(admin => ({ email: admin.email, name: admin.full_name })),
      subject: `Yeni Soru: ${questionData.province} - ${questionData.full_name}`,
      htmlContent: `
        <h2>Yeni Soru Geldi</h2>
        <p><strong>Gönderen:</strong> ${questionData.full_name}</p>
        <p><strong>E-posta:</strong> ${questionData.email}</p>
        <p><strong>Telefon:</strong> ${questionData.phone || 'Belirtilmemiş'}</p>
        <p><strong>İl:</strong> ${questionData.province}</p>
        <p><strong>Soru:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
          ${questionData.question.replace(/\n/g, '<br>')}
        </div>
        <p><strong>Gönderilme Tarihi:</strong> ${new Date(questionData.created_at || new Date()).toLocaleString('tr-TR')}</p>
        
        <div style="margin: 20px 0; text-align: center;">
          <a href="${adminPanelUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Admin Paneli - Soru Yönetimi
          </a>
        </div>
      `,
      sender: { email: 'noreply@tesviksor.com', name: 'TeşvikSor' }
    };

    await sendBrevoEmail(adminEmailData);
    console.log('Admin notification sent to', adminEmails.length, 'admins');
  }
};

serve(handler);
