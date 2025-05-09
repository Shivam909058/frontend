import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "../../../../lib/supabase";
import { Spinner } from "@material-tailwind/react";

interface Follower {
  id: string;
  username: string;
  profileUrl: string;
  name: string;
  isFollowed?: boolean;
}

function Followers() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const toggle = searchParams.get("toggleFollow");
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [following, setFollowing] = useState<Follower[]>([]);
  const [toggleFollow, setToggleFollow] = useState<string | null>(toggle);
  const [followActionCount, setFollowActionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(
    null
  );
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_ID);
    const parsedToken = token ? JSON.parse(token) : null;
    const authenticatedEmail = parsedToken?.user?.email;

    const fetchAuthenticatedUserId = async () => {
      if (!authenticatedEmail) return;

      const { data, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", authenticatedEmail)
        .single();

      if (error) {
        console.error("Error fetching user id:", error.message);
        return;
      }

      setAuthenticatedUserId(data?.id);
    };

    fetchAuthenticatedUserId();
  }, [id]);

  useEffect(() => {
    const fetchFollowers = async () => {
      setIsLoading(true);
      try {
        const { data: followersData, error: followersError } = await supabase
          .from("followers")
          .select(
            `
             followed_by_user_id,
             followed_by_user:followed_by_user_id (id, username, profile_picture_url, name)
           `
          )
          .eq("following_user_id", id);

        if (followersError) {
          throw followersError;
        }

        const transformedFollowersData: Follower[] = followersData.map(
          (item: any) => ({
            id: item.followed_by_user.id,
            username: item.followed_by_user.username,
            profileUrl: item.followed_by_user.profile_picture_url || null,
            name: item.followed_by_user.name,
            isFollowed: false, // Default value
          })
        );

        if (authenticatedUserId) {
          const { data: followingData, error: followingError } = await supabase
            .from("followers")
            .select("following_user_id")
            .eq("followed_by_user_id", authenticatedUserId);

          if (followingError) {
            throw followingError;
          }

          transformedFollowersData.forEach((follower) => {
            follower.isFollowed = followingData.some(
              (follow) => follow.following_user_id === follower.id
            );
          });
        }

        setFollowers(transformedFollowersData);
      } catch (error: unknown) {
        console.error("Error fetching followers:", (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowers();
  }, [id, authenticatedUserId, followActionCount]);

  useEffect(() => {
    const fetchFollowing = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("followers")
          .select(
            `
              following_user_id,
              following_user:following_user_id (id, username, profile_picture_url, name)
            `
          )
          .eq("followed_by_user_id", id);

        if (error) {
          throw error;
        }

        if (data) {
          const transformedData: Follower[] = data.map((item: any) => ({
            id: item.following_user.id,
            username: item.following_user.username,
            profileUrl: item.following_user.profile_picture_url || null,
            name: item.following_user.name,
          }));
          setFollowing(transformedData);
        }
      } catch (error: unknown) {
        console.error("Error fetching following:", (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFollowing();
  }, [id, followActionCount]);

  const handleFollow = async (userIdToFollow: string) => {
    try {
      const { error: followError } = await supabase.from("followers").insert([
        {
          following_user_id: userIdToFollow,
          followed_by_user_id: authenticatedUserId,
        },
      ]);

      if (followError) {
        throw followError;
      } else {
        setFollowers((prevFollowers) =>
          prevFollowers.map((follower) => {
            if (follower.id === userIdToFollow) {
              return { ...follower, isFollowed: true };
            }
            return follower;
          })
        );
        setFollowActionCount(followActionCount + 1);
      }

      const { error: notificationError } = await supabase
        .from("notifications")
        .insert([
          {
            user_id: authenticatedUserId,
            trigger_user_id: userIdToFollow,
            action_type: "follow",
          },
        ]);

      if (notificationError) {
        console.error(
          "Failed to create notification:",
          notificationError.message
        );
      }
    } catch (error: unknown) {
      console.error("Error following user:", (error as Error).message);
    }
  };

  const handleUnfollow = async (userIdToUnfollow: string) => {
    try {
      const { error } = await supabase.from("followers").delete().match({
        following_user_id: userIdToUnfollow,
        followed_by_user_id: authenticatedUserId,
      });

      if (error) {
        throw error;
      } else {
        setFollowers((prevFollowers) =>
          prevFollowers.map((follower) => {
            if (follower.id === userIdToUnfollow) {
              return { ...follower, isFollowed: false };
            }
            return follower;
          })
        );
        setFollowActionCount(followActionCount + 1);
      }
    } catch (error: unknown) {
      console.error("Error unfollowing user:", (error as Error).message);
    }
  };

  if (isLoading) {
    return (
      <div className="grid place-items-center h-screen">
        <Spinner
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center max-w-[430px]">
      <section className="flex gap-3 w-full bg-white rounded border-0 border-solid shadow-lg border-stone-300 p-3 h-[calc(100vh-180px)] overflow-y-auto">
        <div className="flex flex-col grow shrink-0 basis-0 w-full">
          <div className="flex gap-5 justify-between w-full text-sm leading-8 text-slate-900 sticky top-0 bg-white z-10 pb-2">
            <div className="flex gap-5">
              <div
                className={`font-lexend justify-center px-2.5 cursor-pointer pt-[1.5px] ${
                  toggleFollow === "false"
                    ? ` bg-gray-100 rounded-xl border-[1px] border-black border-solid `
                    : ``
                }`}
                onClick={() => setToggleFollow("false")}
              >
                {followers.length}
                {followers.length > 1 ? " Followers" : " Follower"}
              </div>
              <div
                className={`font-lexend justify-center px-2.5 cursor-pointer pt-[1.5px] ${
                  toggleFollow === "true"
                    ? ` bg-gray-100 rounded-xl border-[1px] border-black border-solid `
                    : ``
                }`}
                onClick={() => setToggleFollow("true")}
              >
                {following.length} Following
              </div>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="border-[1px] rounded-full border-ui-90 p-3"
            >
              <img
                src={"/assets/cancel.svg"}
                alt="close image"
                className="h-3 w-3 object-cover rounded-full"
              />
            </button>
          </div>
          <div className="flex flex-col justify-between mt-2 w-full">
            {toggleFollow === "false" &&
              followers.map((follower) => (
                <>
                  <article className="flex gap-1.5 items-center mb-3 cursor-pointer">
                    <button
                      className="rounded-full border-solid border-[.8px] border-ui-90 bg-white w-10 h-10 flex items-center justify-center overflow-hidden"
                      onClick={() => navigate(`/${follower.username}`)}
                    >
                      {follower.profileUrl ? (
                        <img
                          src={`${
                            import.meta.env.VITE_SUPABASE_URL
                          }/storage/v1/object/public/img/${
                            follower.profileUrl
                          }`}
                          alt="user image"
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <img src="/assets/profile.svg" alt="logo image" />
                      )}
                    </button>
                    <div
                      className="flex flex-col grow shrink-0 px-[3px] basis-0 w-fit"
                      onClick={() => navigate(`/${follower.username}`)}
                    >
                      <div className="flex gap-1.5 items-baseline">
                        <p className="text-[14px] font-semibold text-[#8e52da] font-lexend">
                          @{follower.username}
                        </p>
                      </div>
                      <p className=" text-[14px] text-neutral-500 font-lexend">
                        {follower.name}
                      </p>
                    </div>
                    {authenticatedUserId &&
                      !follower.isFollowed &&
                      follower.id !== authenticatedUserId && (
                        <button
                          className="justify-center px-4 py-1 my-auto text-[12px] leading-4 text-black whitespace-nowrap rounded border-[1.3px] border-red-500 border-solid font-lexend mr-5"
                          onClick={() => handleFollow(follower.id)}
                        >
                          Follow
                        </button>
                      )}
                  </article>
                  <div
                    className={` h-[.5px] w-full bg-blue-gray-100 mb-3`}
                  ></div>
                </>
              ))}
            {toggleFollow === "true" &&
              following.map((follower) => (
                <>
                  <article className="flex gap-1.5 items-center mb-3 cursor-pointer">
                    <button
                      className="rounded-full border-solid border-[.8px] border-ui-90 bg-white w-10 h-10 flex items-center justify-center overflow-hidden"
                      onClick={() => navigate(`/${follower.username}`)}
                    >
                      {follower.profileUrl ? (
                        <img
                          src={`${
                            import.meta.env.VITE_SUPABASE_URL
                          }/storage/v1/object/public/img/${
                            follower.profileUrl
                          }`}
                          alt="user image"
                          className="h-full w-full object-cover rounded-full"
                        />
                      ) : (
                        <img src="/assets/profile.svg" alt="logo image" />
                      )}
                    </button>
                    <div
                      className="flex flex-col grow shrink-0 px-[3px] basis-0 w-fit"
                      onClick={() => navigate(`/${follower.username}`)}
                    >
                      <div className="flex gap-1.5 items-baseline">
                        <p className="text-[14px] font-semibold text-[#8e52da] font-lexend">
                          @{follower.username}
                        </p>
                      </div>
                      <p className=" text-[14px] text-neutral-500 font-lexend">
                        {follower.name}
                      </p>
                    </div>
                    {id === authenticatedUserId && (
                      <button
                        className="justify-center px-4 py-1 my-auto text-[12px] leading-4 text-black whitespace-nowrap rounded border-[1.3px] border-red-500 border-solid font-lexend mr-5"
                        onClick={() => {
                          handleUnfollow(follower.id);
                        }}
                      >
                        Unfollow
                      </button>
                    )}
                  </article>
                  <div
                    className={` h-[.5px] w-full bg-blue-gray-100 mb-3`}
                  ></div>
                </>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Followers;
