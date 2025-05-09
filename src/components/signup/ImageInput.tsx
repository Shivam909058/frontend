import { useState, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabase";

export const ImageInput = ({
  label,
  id,
  onUploadSuccess,
}: {
  label: string;
  id: string;
  onUploadSuccess: (data: {
    id: string;
    value: string;
    signedUrl: string;
  }) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const uploadToSupabase = async (file: File) => {
    setUploading(true);
    setUploadError(false);
    setUploaded(false);

    const fileExt = file.name.split(".").pop();
    const fileName = `public/${new Date().getTime()}.${fileExt}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("id_documents")
      .upload(fileName, file);

    if (uploadError) {
      console.error("Error uploading image:", uploadError.message);
      setUploading(false);
      setUploadError(true);
      return;
    }

    if (uploadData) {
      const fileId = uploadData.path;
      // Generate a signed URL for the uploaded file
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("id_documents")
          .createSignedUrl(fileId, 60 * 60 * 24 * 365);
      if (signedUrlError) {
        console.error("Error generating signed URL:", signedUrlError.message);
        setUploading(false);
        setUploadError(true);
        return;
      }

      const signedUrl = signedUrlData.signedUrl;
      onUploadSuccess({ id, value: fileId, signedUrl: signedUrl });
      setUploading(false);
      setUploaded(true);
    }
  };

  const handleImageButtonClick = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    if (!uploading) {
      imageInputRef.current?.click();
    }
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadToSupabase(file);
    }
  }, []);

  let element;
  if (uploading) {
    element = (
      <div className="flex flex-row px-4 py-3 gap-2 border-0.8 rounded-xl border-ui-10 w-28 justify-center">
        <div className="flex gap-2 mt-[2px]">
          <div className="w-2 h-2 rounded-full animate-pulse bg-positive-50"></div>
          <div className="w-2 h-2 rounded-full animate-pulse bg-positive-50"></div>
          <div className="w-2 h-2 rounded-full animate-pulse bg-positive-50"></div>
        </div>
      </div>
    );
  } else if (uploadError) {
    element = (
      <button
        className=" bg-negative-20 px-11 py-2 border-0 rounded-xl"
        onClick={handleImageButtonClick}
      >
        <div className="text-white font-lexend font-medium text-place">
          Error!
        </div>
      </button>
    );
  } else if (uploaded) {
    element = (
      <button
        className="bg-positive-5 px-11 py-2 border-0 rounded-xl"
        onClick={handleImageButtonClick}
      >
        <img
          src={"/assets/done.svg"}
          alt="add"
          width={25}
          height={25}
          className="w-5 h-5"
        />
      </button>
    );
  } else {
    element = (
      <button
        className="flex flex-row px-4 py-3 gap-2 border-0.8 rounded-xl border-ui-20"
        onClick={handleImageButtonClick}
      >
        <img
          src={"/assets/signup_add.svg"}
          alt="add"
          width={25}
          height={25}
          className="w-3 h-3"
        />

        <span className="text-ui-70 font-lexend font-medium text-place">
          {label}
        </span>
      </button>
    );
  }

  return (
    <>
      <input
        type="file"
        className="hidden"
        ref={imageInputRef}
        onChange={handleChange}
      />
      {element}
    </>
  );
};
