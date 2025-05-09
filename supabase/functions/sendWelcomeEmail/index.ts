import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../cors.ts";
import {
  SESClient,
  SendEmailCommand,
} from "https://esm.sh/@aws-sdk/client-ses";

const AWS_REGION = Deno.env.get("AWS_REGION");
const AWS_ACCESS_KEY_ID = Deno.env.get("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = Deno.env.get("AWS_SECRET_ACCESS_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL");

const sesClient = new SESClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID!,
    secretAccessKey: AWS_SECRET_ACCESS_KEY!,
  },
});

const handler = async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { email } = await request.json();

  const emailContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ShaktyAI</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5ebf0;">
  <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
    <h1 style="color: #4a4a4a; text-align: center; border-bottom: 2px solid #4a4a4a; padding-bottom: 10px;">Welcome to ShaktyAI – Your Personal AI Companion!</h1>
    <p style="font-size: 16px;">Hi there,</p>
    <p style="font-size: 16px;">Welcome to ShaktyAI! We're thrilled to have you on board as part of the ShaktyAI family. ShaktyAI is here to empower you with AI-powered insights, whether you're planning your next adventure, managing your tasks, or looking for quick answers.</p>
    <p style="font-size: 16px;">As you begin exploring, here are a few sample prompts you can try:</p>
    <div style="background-color: #f5ebf0; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
      <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 10px;">Planning a trip</h2>
      <p style="font-size: 14px; font-style: italic;">"Help me create an itinerary from all the Reels I have saved for a trip to Goa?"</p>
      <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 10px;">Budgeting and spending</h2>
      <p style="font-size: 14px; font-style: italic;">"Going on a solo weekend getaway, keep track of my spending and budget"</p>
      <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 10px;">To-Do-List</h2>
      <p style="font-size: 14px; font-style: italic;">"Help me track my Activity checklist for the week"</p>
      <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 10px;">Meal Planning</h2>
      <p style="font-size: 14px; font-style: italic;">"I have so many saved recipes, please make a meal plan from those for next week"</p>
      <h2 style="color: #2c3e50; font-size: 18px; margin-bottom: 10px;">Getting insights</h2>
      <p style="font-size: 14px; font-style: italic;">"Summarize the key things I should know about travelling to Japan based on these Instagram videos"</p>
    </div>
    <p style="font-size: 16px;">At ShaktyAI, we're here to support you every step of the way. Have a question? Just ask ShaktyAI, and let it guide you with personalized suggestions.</p>
    <h2 style="color: #2c3e50; font-size: 20px;">Need help?</h2>
    <p style="font-size: 16px;">If you ever need assistance or have questions about using ShaktyAI, you can always ask our AI assistant directly or contact us via email.</p>
    <p style="font-size: 16px;">Thank you for joining ShaktyAI, and we're excited to be a part of your journey!</p>
    <p style="font-size: 16px;">Best regards,<br>The ShaktyAI Team</p>
    <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
      <p style="font-size: 14px; color: #777;">karthik@instalane.co<br><a href="https://shaktyai.com" style="color: #3498db; text-decoration: none;">shaktyai.com</a></p>
    </div>
  </div>
</body>
</html>
`;

  const params = {
    Destination: {
      ToAddresses: [email],
    },
    Message: {
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: emailContent,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: "Welcome to ShaktyAI – Your Personal AI Companion!",
      },
    },
    Source: FROM_EMAIL,
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);

    return new Response(
      JSON.stringify({
        message: "Welcome email sent successfully",
        messageId: result.MessageId,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send welcome email",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
};

serve(handler);
