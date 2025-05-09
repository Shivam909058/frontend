import { useRef, useCallback, useMemo } from "react";
import { useUpdateProfilePictureMutation } from "../../../../profile/hooks/useUpdateProfilePictureMutation";
import { ChangeEvent } from "react";

export const useProfileImageUpload = ({ userId }: { userId: string }) => {
  const { mutate, uploadProgress, isPending, isError } =
    useUpdateProfilePictureMutation({ userId });
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleImageChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const imageFile = event.target.files?.[0];
      if (!imageFile) return;

      const formData = new FormData();
      formData.append("profile_picture", imageFile);

      mutate(formData);
    },
    [mutate]
  );

  const handleProfileImageClick = useCallback(
    () => fileInputRef.current?.click(),
    []
  );

  const hiddenInputProps = useMemo(
    () => ({
      className: "hidden",
      onChange: handleImageChange,
    }),
    [handleImageChange]
  );

  return {
    hiddenInputRef: fileInputRef,
    hiddenInputProps,
    onProfileImageClick: handleProfileImageClick,
    uploadProgress,
    isLoading: isPending,
    isError,
  };
};
