import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../cors.ts"; // Assuming cors.ts is correctly set up for CORS headers

const POSTMARK_TOKEN = Deno.env.get("POSTMARK_TOKEN");

const handler = async (request: Request): Promise<Response> => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = await request.json();
  const record = json.record;

  // Check if the record is verified
  if (record.is_verified) {
    const res = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": `${POSTMARK_TOKEN}`,
      },
      body: JSON.stringify({
        From: "no-reply@wandergals.com",
        To: record.email,
        Subject: "Your WanderGals account is verified",
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
            Hello ${record.name},
          </h1>
          <div class="text-sm leading-5 text-red-500 underline max-w-[440px]">
            <span class="">Great news!</span>
            <span style="color: #8e52da">Your account is now verified,</span>
            <span class="">
              and you're all set to dive into a world designed exclusively for
              women, by women.
            </span>
            <div style="margin-top: 20px">
              <span class="">Click link to get started :</span>
              <a
                href="https://www.wandergals.com"
                style="color: #fd5930; margin-top: 12px"
                >www.wandergals.com</a
              >
            </div>

            <p class="">Welcome to the Wandergals community!</p>

            <span class="">Warmest Regards,</span>
            <br/>
            <span class="">The Wandergals Team</p>
          </div>
        </div>
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/1ecd2932161e426a4f17274490499b1d9b925f11eb6d2abb9f92c49f93fe8dab?apiKey=9e0e13693454444cac96580d4357c01c&"
          alt="Illustration of a woman traveling"
          style="width: 100%; height: auto; margin-top: 20px"
        />
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

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } else {
    // Return a response indicating the record is not verified
    return new Response(JSON.stringify({ message: "Record is not verified" }), {
      status: 400,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
};

serve(handler);
