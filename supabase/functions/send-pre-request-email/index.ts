import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PreRequestEmailData {
  to: string;
  companyName: string;
  contactPerson: string;
  requestId: string;
  taxId: string;
}

const generateRandomString = (length: number): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, companyName, contactPerson, requestId, taxId }: PreRequestEmailData = await req.json();

    const brevoApiKey = Deno.env.get('BREVO_API_KEY');
    if (!brevoApiKey) {
      throw new Error('BREVO_API_KEY not configured');
    }

    // Generate 6-digit random characters for the tracking URL
    const randomCode = generateRandomString(6);
    const trackingUrl = `https://tesviksor.com/tzy/kayitli-talepler?taxId=${taxId}&code=${randomCode}`;

    const emailData = {
      sender: {
        name: "Teşviksor",
        email: "noreply@tesviksor.com"
      },
      to: [
        {
          email: to,
          name: contactPerson
        }
      ],
      subject: `Tedarik Zinciri Yerlileştirme Ön Talep ${requestId}`,
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Tedarik Zinciri Yerlileştirme Ön Talep Onayı</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #1e40af;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: #f8fafc;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              background-color: #1e40af;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 6px;
              display: inline-block;
              margin: 20px 0;
              font-weight: bold;
            }
            .button:hover {
              background-color: #1d4ed8;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #64748b;
              font-size: 14px;
            }
            .highlight {
              background-color: #dbeafe;
              padding: 15px;
              border-radius: 6px;
              border-left: 4px solid #1e40af;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Tedarik Zinciri Yerlileştirme</h1>
            <p>Ön Talep Onayı</p>
          </div>
          
          <div class="content">
            <p>Sayın <strong>${contactPerson}</strong>,</p>
            
            <div class="highlight">
              <p><strong>Yatırım Destek Platformu (tesviksor.com) üzerinden göndermiş olduğunuz Tedarik Zinciri Yerlileştirme Ön Talebiniz alınmıştır.</strong></p>
            </div>
            
            <p>Talebiniz değerlendirilerek, en kısa sürede sizinle iletişime geçilecektir.</p>
            
            <p><strong>Talep Detayları:</strong></p>
            <ul>
              <li>Talep No: ${requestId}</li>
              <li>Firma: ${companyName}</li>
              <li>İletişim Kişisi: ${contactPerson}</li>
              <li>Gönderim Tarihi: ${new Date().toLocaleDateString('tr-TR')}</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingUrl}" class="button">YENİ TALEP OLUŞTUR</a>
            </div>
            
            <p><strong>Sonraki Adımlar:</strong></p>
            <ul>
              <li>Uzman ekibimiz talebinizi değerlendirecek</li>
              <li>Uygun tedarikçiler tespit edilerek sizinle paylaşılacak</li>
              <li>Süreç hakkında bilgilendirme e-postaları alacaksınız</li>
            </ul>
            
            <p>Platformumuzu kullandığınız için teşekkür ederiz.</p>
            
            <p>Saygılarımızla,<br>
            <strong>Teşviksor Yatırım Destek Platformu</strong></p>
          </div>
          
          <div class="footer">
            <p>Bu otomatik bir mesajdır. Lütfen bu e-postaya yanıt vermeyiniz.</p>
            <p>© 2024 Teşviksor. Tüm hakları saklıdır.</p>
          </div>
        </body>
        </html>
      `
    };

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Api-Key': brevoApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Brevo API error:', errorText);
      throw new Error(`Email sending failed: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);

    return new Response(JSON.stringify({ 
      success: true, 
      messageId: result.messageId,
      trackingUrl 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-pre-request-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);