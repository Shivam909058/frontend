import { corsHeaders } from "../cors.ts";
import {
  getSignedUrl,
  getSignatureKey,
} from "https://deno.land/x/aws_s3_presign/mod.ts";
import { decode } from "https://deno.land/x/djwt@v3.0.2/mod.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized", response: {} }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      }
    );
  }
  const [payload]: any = decode(token);
  if (payload.role === "anon") {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized", response: {} }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      }
    );
  }
  const { fileName } = await req.json();
  if (!fileName) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Filename is required",
        response: {},
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 412,
      }
    );
  }
  const signatureKey = getSignatureKey({
    date: new Date(),
    region: Deno.env.get("B_S3_BUCKET_REGION") ?? "",
    secretAccessKey: Deno.env.get("B_S3_SECRET_ACCESS_KEY") ?? "",
  });

  const signedUrl = getSignedUrl({
    accessKeyId: Deno.env.get("B_S3_ACCESS_KEY_ID") ?? "",
    secretAccessKey: Deno.env.get("B_S3_SECRET_ACCESS_KEY") ?? "",
    bucket: Deno.env.get("B_S3_BUCKET_NAME") ?? "",
    key: fileName,
    region: Deno.env.get("B_S3_BUCKET_REGION") ?? "",
    method: "PUT",
    expiresIn: 3600,
    signatureKey,
  });

  return new Response(
    JSON.stringify({
      success: true,
      message: "Presigned url created successfully",
      response: { signedUrl },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
