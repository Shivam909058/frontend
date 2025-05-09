import { useCallback, useEffect } from "react";
import { useUserInfoQuery } from "../../../profile/hooks/useUserInfoQuery";
import { ProfileImage } from "./components/ProfileImage";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../lib/supabase";

export type FeedHeaderProps = {
  imageUrl?: string;
  name: string;
  bio?: string;
};

export const FeedHeader = ({
  userId,
  isLoggedInUserFeed,
}: {
  userId: string;
  isLoggedInUserFeed: boolean;
  isLoggedInUser: boolean;
}) => {
  const { isLoading, data: user = {} } = useUserInfoQuery({ userId });
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_ID);
    const parsedToken = token ? JSON.parse(token) : null;
    const authenticatedEmail = parsedToken?.user?.email;

    const fetchAuthenticatedUserInfo = async () => {
      if (!authenticatedEmail) return;

      const { error } = await supabase
        .from("users")
        .select("id")
        .eq("email", authenticatedEmail)
        .single();

      if (error) {
        console.error("Error fetching user info:", error.message);
        return;
      }
    };

    fetchAuthenticatedUserInfo();
  }, [user?.id, userId]);

  const onEditFeed = useCallback(
    () => navigate(`/profile?returnTo=${userId}`),
    []
  );

  const { bio, name, location, profile_picture_url } = user;
  const imageUrl = profile_picture_url || "";

  if (isLoading) {
    return <div></div>;
  }

  return (
    <section className="w-full bg-[#fef2ea] rounded-3xl p-5 relative">
      <div className="flex flex-row justify-end">
        <button
          className="w-6 h-6 rounded-full bg-transparent flex justify-center items-center border-1 border-solid border-ui-50"
          onClick={onEditFeed}
        >
          <img src="/assets/edit.svg" alt="edit icon" height={13} width={13} />
        </button>
      </div>
      <div className="flex flex-row items-center gap-4">
        <ProfileImage
          userId={userId}
          isLoggedInUserFeed={isLoggedInUserFeed}
          image={imageUrl}
        />
        <div className="flex-1">
          <h1
            className="font-semibold font-lexend"
            style={{ fontSize: "14px", lineHeight: "32px" }}
          >
            {name}
          </h1>
          {location && (
            <div className="flex items-center justify-start mt-[-5px]">
              <img
                src={"/assets/location.svg"}
                alt="location img"
                width={7}
                height={7}
              />
              <p className="font-light font-lexend text-[10px] ml-[5px] text-[#5F5F5B]">
                {location}
              </p>
            </div>
          )}
          {bio ? (
            <p
              className="text-[12px] font-light break-words font-lexend"
              dangerouslySetInnerHTML={{ __html: bio }}
            />
          ) : null}
        </div>
      </div>
    </section>
  );
};
