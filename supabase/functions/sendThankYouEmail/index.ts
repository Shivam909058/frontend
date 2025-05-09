import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../cors.ts";

const POSTMARK_TOKEN = Deno.env.get("POSTMARK_TOKEN");
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

const handler = async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { name, email, frontImageSignedUrl, backImageSignedUrl } =
    await request.json();

  // First email to the user
  await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "X-Postmark-Server-Token": `${POSTMARK_TOKEN}`,
    },
    body: JSON.stringify({
      From: "no-reply@wandergals.com",
      To: email,
      Subject: "Welcome to Wandergals",
      HtmlBody: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>WANDERGALS</title>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Anton&display=swap"
            rel="stylesheet"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body style="font-family: 'Inter', sans-serif; background-color: #f3f4f6">
          <section style="padding: 32px 40px; background-color: #f3f4f6">
            <header
              style="
                display: flex;
                gap: 8px;
                align-items: center;
                font-size: 24px;
                color: #1f2937;
                font-family: 'Anton', sans-serif;
                font-weight: 400;
                letter-spacing: 0.05em;
                width: 100%;
                margin-bottom: 32px;
              "
            >
            <img
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/b98674e2f4512ca430a05a56e8e3978d7b00c9e86e4d0256540b4525a9cef213?apiKey=9e0e13693454444cac96580d4357c01c&"
            alt="Wandergals logo"
            style="width: 44px; height: 44px; margin-right: 8px; margin-top: 4px"
          />
          <h1 style="flex-grow: 1; margin: auto 0">WANDERGALS</h1>
            </header>
            <article
              style="
                background-color: #ffffff;
                flex-grow: 1;
                width: 100%;
                margin-top: 16px;
              "
            >
              <div style="padding: 20px">
                <h1
                  style="
                    font-size: 22px;
                    font-weight: 500;
                    color: #000000;
                    margin-bottom: 16px;
                  "
                >
                  Welcome to the premium global travel network for women
                </h1>
                <p
                  style="
                    font-size: 14px;
                    color: #4b5563;
                    margin-top: 16px;
                    line-height: 22px;
                  "
                >
                  As part of our commitment to creating a safe and secure environment,
                  we are currently verifying the ID photo you submitted. This process
                  helps us ensure the authenticity and security of our user base.
                </p>
              </div>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/1ecd2932161e426a4f17274490499b1d9b925f11eb6d2abb9f92c49f93fe8dab?apiKey=9e0e13693454444cac96580d4357c01c&"
                alt="Illustration of a woman traveling"
                style="width: 100%; height: auto; margin-top: 20px"
              />
              <div
                style="
                  text-align: center;
                  padding: 20px;
                  font-size: 16px;
                  color: #000000;
                  margin-top: 32px;
                "
              >
                <p style="text-align: left">What's Next?</p>
                <div style="margin-left: -20px">
                  <ul style="text-align: left">
                    <li style="margin-top: 10px; line-height: 22px">
                      <span style="font-weight: 500">Verification Process:</span> Our
                      team is diligently reviewing your submission. This process
                      typically takes 24 to 48 hours, though we strive to complete it
                      as swiftly as possible.
                    </li>
                    <li style="margin-top: 10px; line-height: 22px">
                      <span style="font-weight: 500">Notification:</span> You will
                      receive an email notification once your verification is
                      complete. If additional information is needed, we'll reach out
                      to you directly.
                    </li>
                    <li style="margin-top: 10px; line-height: 22px">
                      <span style="font-weight: 500">Getting Started:</span> As soon
                      as you are verified, you can login with your email-id and start
                      exploring.
                    </li>
                  </ul>
                </div>
                <p style="margin-top: 32px; text-align: left; line-height: 22px">
                  Warmest Regards,<br />The Wandergals Team
                </p>
              </div>
            </article>
            <footer style="text-align: center; margin-top: 32px">
              <div style="font-size: 12px; color: #000000; margin-top: 20px">
                © 2024 | Instalane Internet Pvt Ltd
              </div>
              <nav style="font-size: 12px; color: #000000; margin-top: 20px">
                <a href="https://wandergals.com/about-us" style="color: #000000"
                  >About Us</a
                >
                |
                <a href="https://wandergals.com/privacy" style="color: #000000"
                  >Privacy Policy</a
                >
                |
                <a
                  href="https://wandergals.com/tos"
                  style="color: #000000"
                  >Terms & Services</a
                >
              </nav>
            </footer>
          </section>
        </body>
      </html>
      `,
      MessageStream: "outbound",
    }),
  });

  // Second email to admin
  const notificationEmailResponse = await fetch(
    "https://api.postmarkapp.com/email",
    {
      method: "POST",
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": `${POSTMARK_TOKEN}`,
      },
      body: JSON.stringify({
        From: "admin@wandergals.com",
        To: `${ADMIN_EMAIL}`,
        Subject: "New User Onboarded",
        HtmlBody: `
          <html>
            <body>
              <h1>New User Onboarded</h1>
              <p>A new user has been successfully onboarded. Here are their details:</p>
              <table>
                <tr>
                  <th>Name:</th>
                  <td>${name}</td>
                </tr>
                <tr>
                  <th>Email:</th>
                  <td>${email}</td>
                </tr>
                <tr>
                  <th>Front Image:</th>
                  <td><a href="${frontImageSignedUrl}">View Image</a></td>
                </tr>
                <tr>
                  <th>Back Image:</th>
                  <td><a href="${backImageSignedUrl}">View Image</a></td>
                </tr>
              </table>
            </body>
          </html>
        `,
        MessageStream: "outbound",
      }),
    }
  );

  const notificationData = await notificationEmailResponse.json();

  return new Response(
    JSON.stringify({
      user_email_sent: true,
      notification_sent: notificationData,
    }),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    }
  );
};

serve(handler);
