import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosProgressEvent } from "axios";

// Function to generate a random string for file names
const generateRandomString = (length = 10) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

export const useMediaUploadMutation = ({
  onSuccess,
  onError,
}: { onSuccess?: (res: unknown) => void; onError?: () => void } = {}) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: async (file: File) => {
      const randomFileName =
        generateRandomString() + file.name.substr(file.name.lastIndexOf("."));

      const presignedUrlResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/getPreSignedUrl`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, // Replace with your Supabase JWT
          },
          body: JSON.stringify({ fileName: randomFileName }),
        }
      );

      if (!presignedUrlResponse.ok) {
        throw new Error("Failed to fetch presigned URL");
      }

      const responseData = await presignedUrlResponse.json();
      const signedUrl = responseData?.response?.signedUrl;

      if (!signedUrl) {
        throw new Error("Signed URL not found in response");
      }

      const uploadResponse = await axios.put(signedUrl, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (
            progressEvent.total !== null &&
            progressEvent.total !== undefined
          ) {
            const progress = (progressEvent.loaded / progressEvent.total) * 100;
            setUploadProgress(progress);
          }
        },
      });

      if (uploadResponse.status !== 200) {
        throw new Error("Failed to upload file to S3");
      }

      return { newFileName: randomFileName };
    },
    onSuccess,
    onError,
  });

  return { uploadProgress, ...mutation };
};
