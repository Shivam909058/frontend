import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "../../../lib/supabase";

export const useUpdateProfilePictureMutation = ({
  userId,
}: {
  userId: string;
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);

  const mutate = useMutation({
    mutationFn: async (updatedUser: FormData) => {
      const file = updatedUser.get("profile_picture");
      if (!file) throw new Error("No file selected");

      const fileName = `${userId}-${Date.now()}.${(file as File).name
        .split(".")
        .pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("img")
        .upload(fileName, file, {
          onUploadProgress: (event: ProgressEvent<EventTarget>) => {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(progress);
          },
        } as any); // Add 'as FileOptions' to specify the type

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_picture_url: fileName })
        .match({ id: userId });

      if (updateError) throw updateError;

      return { success: true };
    },
  });

  return { ...mutate, uploadProgress };
};
