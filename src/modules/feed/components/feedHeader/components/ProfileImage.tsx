import { useEffect, useState } from "react";
import { useProfileImageUpload } from "../hooks/useProfileImageUpload";
import { Progress } from "@material-tailwind/react";
import { supabase } from "../../../../../lib/supabase";

const ProfileImage = ({
  userId,
  isLoggedInUserFeed,
  image,
}: {
  userId: string;
  isLoggedInUserFeed: boolean;
  image: string;
}) => {
  const [imageUrl, setImageUrl] = useState<string | null>(image);
  const {
    hiddenInputProps,
    hiddenInputRef,
    onProfileImageClick,
    isError,
    isLoading,
    uploadProgress,
  } = useProfileImageUpload({ userId });
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;

  useEffect(() => {
    const channel = supabase
      .channel("*")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "users" },
        (payload) => {
          if (payload.new.email === authenticatedEmail) {
            setImageUrl(payload.new.profile_picture_url);
            window.location.reload();
          } else {
            return;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  let el = null;
  if (isLoading) {
    el = (
      <div className="h-full flex flex-col justify-center items-center rounded-full p-2">
        <Progress
          placeholder="Uploading image..."
          value={uploadProgress}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <div className="text-ui-90 font-lexend font-light text-small">
          Uploading...
        </div>
      </div>
    );
  } else if (isError) {
    el = (
      <div className="h-full w-full flex flex-row justify-center items-center p-2 rounded-full text-red-500 font-lexend font-light text-small">
        Something went wrong
      </div>
    );
  } else {
    el = (
      <>
        {imageUrl ? (
          <img
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/img/${imageUrl}`}
            className="h-full w-full rounded-full object-cover bg-white"
            alt="User Profile Image"
          />
        ) : (
          <img
            src={isLoggedInUserFeed ? "/assets/add.svg" : "/assets/profile.svg"}
            alt="no image"
            height={24}
            width={24}
            className="h-full w-full rounded-full object-cover"
          />
        )}
      </>
    );
  }

  return (
    <div
      className={`rounded-full border-1 border-x border-y flex-shrink border-solid p-1 bg-white ${
        isLoggedInUserFeed ? "cursor-pointer" : "cursor-default"
      }`}
      style={{ height: "120px", width: "120px" }}
      onClick={isLoggedInUserFeed ? onProfileImageClick : undefined}
    >
      {el}
      {isLoggedInUserFeed ? (
        <input
          type="file"
          accept="image/*"
          ref={hiddenInputRef}
          {...hiddenInputProps}
        />
      ) : null}
    </div>
  );
};

export { ProfileImage };
