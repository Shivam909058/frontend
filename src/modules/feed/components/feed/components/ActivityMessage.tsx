import { useCallback, type ReactElement, useState, useEffect } from "react";
import { Post } from "../../../types/post";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../../../lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { ShareButton } from "../../../../../components/ShareButton";

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength - 3)}...`;
};

const VeritcalyExpandedMessage = ({
  post,
  onClick,
  authenticatedUserId,
}: {
  post: Post;
  onClick: () => void;
  authenticatedUserId: string;
}): ReactElement => {
  const navigate = useNavigate();

  const commentMessage =
    post.comments?.user_id === authenticatedUserId
      ? "You commented on a post:"
      : "You saved a comment:";
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>("");
  const [savedCount, setSavedCount] = useState<number>(0);
  const [savedCommentsCount, setSavedCommentsCount] = useState<number>(0);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("profile_picture_url")
        .eq("username", post.created_by)
        .single();

      if (error) {
        console.error("Error fetching user data:", error.message);
        return;
      }

      setProfilePictureUrl(data?.profile_picture_url);
    };

    fetchProfile();
  }, [post.created_by]);

  const { data: commentsCount, isLoading: commentsCountLoading } = useQuery({
    queryFn: async () => {
      if (!post.id) {
        throw new Error("Post ID is required");
      }
      const { data, error } = await supabase
        .from("comments")
        .select("*", { count: "exact" })
        .eq("post_id", post.id);

      if (error) throw error;
      return data.length || 0;
    },
    queryKey: ["COMMENTS_COUNT", post.id],
  });

  const { data: savedCountData, isLoading: savedCountLoading } = useQuery({
    queryFn: async () => {
      if (!post.id) {
        throw new Error("Post ID is required");
      }
      const { data, error } = await supabase
        .from("activities")
        .select("*", { count: "exact" })
        .eq("post_id", post.id)
        .eq("is_post", true);

      if (error) throw error;
      return data.length || 0;
    },
    queryKey: ["SAVED_COUNT", post.id],
  });

  const { data: savedCommentsCountData, isLoading: savedCommentsCountLoading } =
    useQuery({
      queryFn: async () => {
        if (!post.id) {
          throw new Error("Post ID is required");
        }
        const { data, error } = await supabase
          .from("activities")
          .select("*", { count: "exact" })
          .eq("post_id", post.id)
          .eq("is_post", false);

        if (error) throw error;
        return data.length || 0;
      },
      queryKey: ["SAVED_COMMENTS_COUNT", post.id],
    });

  useEffect(() => {
    if (savedCountData !== undefined) {
      setSavedCount(savedCountData);
    }
    if (savedCommentsCountData !== undefined) {
      setSavedCommentsCount(savedCommentsCountData);
    }
  }, [savedCountData, savedCommentsCountData]);

  function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    const interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " y";
    if (interval === 1) return interval + " y";

    const months = Math.floor(seconds / 2628000);
    if (months > 1) return months + " m";
    if (months === 1) return months + " m";

    const days = Math.floor(seconds / 86400);
    if (days > 1) return days + " d";
    if (days === 1) return days + " d";

    const hours = Math.floor(seconds / 3600);
    if (hours > 1) return hours + " h";
    if (hours === 1) return hours + " h";

    const minutes = Math.floor(seconds / 60);
    if (minutes > 1) return minutes + " min";
    if (minutes === 1) return minutes + " min";

    return "just now";
  }

  const handleUnsave = async () => {
    const { error } = await supabase
      .from("activities")
      .delete()
      .match({ user_id: authenticatedUserId, post_id: post.id, is_post: true });

    if (error) {
      console.error("Error un-saving activity:", error.message);
      return;
    }
    window.location.reload();
  };

  const handleCommentUnsave = async () => {
    const { error } = await supabase.from("activities").delete().match({
      user_id: authenticatedUserId,
      post_id: post.id,
      comment_id: post.comments?.id,
      is_post: false,
    });

    if (error) {
      console.error("Error un-saving activity:", error.message);
      return;
    }
    window.location.reload();
  };

  return (
    <>
      {post.comments ? (
        <p className="text-[10px] font-semibold leading-4 text-slate-900 font-lexend mb-3">
          {commentMessage}
        </p>
      ) : (
        <p className="text-[10px] font-semibold leading-4 text-slate-900 font-lexend mb-3">
          You saved a post:
        </p>
      )}
      <div
        className={`h-full w-full flex flex-col cursor-pointer pb-5 rounded-3xl shadow-lg border-ui-5 border-1`}
      >
        {post.video_url ? (
          <div className="relative">
            <div className="relative">
              <video
                className="w-full rounded-3xl rounded-b-none object-cover min-h-52"
                autoPlay
                loop
                muted
                playsInline
                onClick={onClick}
              >
                <source
                  src={`https://wandergals.s3.ap-south-1.amazonaws.com/${post.video_url}`}
                  type="video/mp4"
                />
              </video>
              <div className="absolute bottom-0 left-[14px] w-[85%] bg-white p-1 px-2 rounded-lg text-[10px] mb-4 font-lexend">
                <p className="text-black">{truncateText(post.caption, 50)}</p>
              </div>
            </div>

            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black via-black/50 to-transparent rounded-t-3xl" />

            <div className="flex items-center justify-between absolute top-2 left-2">
              <div className="flex justify-start items-center">
                <button className="rounded-full border-ui-90 border-[.8px] border-solid bg-white w-7 h-7 flex items-center justify-center overflow-hidden">
                  {profilePictureUrl ? (
                    <img
                      src={`${
                        import.meta.env.VITE_SUPABASE_URL
                      }/storage/v1/object/public/img/${profilePictureUrl}`}
                      alt="user image"
                      className="h-full w-full object-cover rounded-full"
                      onClick={() => navigate(`/${post?.created_by}`)}
                    />
                  ) : (
                    <img
                      src={"/assets/profile.svg"}
                      alt="logo image"
                      onClick={() => navigate(`/${post?.created_by}`)}
                    />
                  )}
                </button>
                <div>
                  <div
                    className="text-white text-[12px] font-medium font-lexend ml-2"
                    onClick={() => navigate(`/${post?.created_by}`)}
                  >
                    {post.created_by}
                  </div>
                  <div
                    className="text-white text-[8px] font-extralight font-lexend ml-2"
                    onClick={() => navigate(`/${post?.created_by}`)}
                  >
                    {timeAgo(new Date(post.created_at))}
                  </div>
                </div>
              </div>
            </div>
            {!post.comments && (
              <div className="flex justify-between w-full mt-3 px-3">
                <div className="flex justify-between items-center">
                  <img
                    src="/assets/comment_icon.svg"
                    alt="comment icon"
                    height={13}
                    width={13}
                    onClick={onClick}
                  />
                  <p
                    className="ml-1 text-ui-50 text-place font-light font-lexend"
                    onClick={onClick}
                  >
                    {commentsCountLoading
                      ? "Loading..."
                      : commentsCount !== 0 && commentsCount}
                  </p>
                  <img
                    src="/assets/saved_icon.svg"
                    alt="saved icon"
                    height={13}
                    width={13}
                    className="ml-4"
                    onClick={() => handleUnsave()}
                  />
                  <p className="ml-1 text-ui-50 text-place font-light font-lexend">
                    {savedCountLoading ? "" : savedCount > 0 && savedCount}
                  </p>
                </div>

                <ShareButton
                  noBg={true}
                  height={18}
                  width={18}
                  postId={post.id}
                  username={post.created_by}
                  style="w-4 h-4"
                />
              </div>
            )}
            {post.comments && (
              <>
                <div className={`my-3`}></div>

                <article className="flex gap-1 items-start px-3">
                  <button className="rounded-full border-solid border-[.8px] border-ui-90 bg-white w-7 h-7 flex items-center justify-center overflow-hidden">
                    {post.comments.user.profile_picture_url ? (
                      <img
                        src={`${
                          import.meta.env.VITE_SUPABASE_URL
                        }/storage/v1/object/public/img/${
                          post.comments.user.profile_picture_url
                        }`}
                        alt="user image"
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <img src="/assets/profile.svg" alt="logo image" />
                    )}
                  </button>
                  <div className="flex flex-col grow shrink-0 px-[3px] basis-0 w-fit mt-[4px]">
                    <div className="flex gap-1.5 items-baseline">
                      <p className="text-[8px] font-semibold text-black font-lexend">
                        @{post.comments.user.username}
                      </p>
                      <p className="flex-auto text-[8px] font-light text-violet-500 text-[#8e52da]">
                        {timeAgo(new Date(post.comments.created_at))}
                      </p>
                    </div>
                    <p className=" text-[10px] text-neutral-500 font-lexend">
                      {post.comments.content}
                    </p>
                    {post.comments?.user_id !== authenticatedUserId && (
                      <div className="flex justify-start items-center mt-1">
                        <img
                          src="/assets/saved_icon.svg"
                          alt="saved icon"
                          height={12}
                          width={12}
                          onClick={() => handleCommentUnsave()}
                        />
                        <p className="ml-1 text-ui-50 text-place font-light font-lexend">
                          {savedCommentsCountLoading
                            ? "Loading..."
                            : savedCommentsCount !== 0 && savedCommentsCount}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              </>
            )}
          </div>
        ) : (
          <div className="relative" onClick={onClick}>
            <div className="relative">
              <img
                src={`https://wandergals.s3.ap-south-1.amazonaws.com/${post.image_url}`}
                className="w-full rounded-3xl rounded-b-none object-cover min-h-52"
              />
              <div className="absolute bottom-0 left-[14px] w-[85%] bg-white p-1 px-2 rounded-lg text-[10px] mb-4 font-lexend">
                <p className="text-black">{truncateText(post.caption, 50)}</p>
              </div>
            </div>
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black via-black/50 to-transparent rounded-t-3xl" />

            <div className="flex items-center justify-between absolute top-2 left-2">
              <div className="flex justify-start items-center">
                <button className="rounded-full border-ui-90 border-[.8px] border-solid bg-white w-7 h-7 flex items-center justify-center overflow-hidden">
                  {profilePictureUrl ? (
                    <img
                      src={`${
                        import.meta.env.VITE_SUPABASE_URL
                      }/storage/v1/object/public/img/${profilePictureUrl}`}
                      alt="user image"
                      className="h-full w-full object-cover rounded-full"
                      onClick={() => navigate(`/${post?.created_by}`)}
                    />
                  ) : (
                    <img
                      src={"/assets/profile.svg"}
                      alt="logo image"
                      onClick={() => navigate(`/${post?.created_by}`)}
                    />
                  )}
                </button>
                <div>
                  <div
                    className="text-white text-[12px] font-medium font-lexend ml-2"
                    onClick={() => navigate(`/${post?.created_by}`)}
                  >
                    {post.created_by}
                  </div>
                  <div
                    className="text-white text-[8px] font-extralight font-lexend ml-2"
                    onClick={() => navigate(`/${post?.created_by}`)}
                  >
                    {timeAgo(new Date(post.created_at))}
                  </div>
                </div>
              </div>
            </div>
            {!post.comments && (
              <div className="flex justify-between w-full mt-3 px-3">
                <div className="flex justify-between items-center">
                  <img
                    src="/assets/comment_icon.svg"
                    alt="comment icon"
                    height={13}
                    width={13}
                    onClick={onClick}
                  />
                  <p
                    className="ml-1 text-ui-50 text-place font-light font-lexend"
                    onClick={onClick}
                  >
                    {commentsCountLoading
                      ? "Loading..."
                      : commentsCount !== 0 && commentsCount}
                  </p>
                  <img
                    src="/assets/saved_icon.svg"
                    alt="saved icon"
                    height={13}
                    width={13}
                    className="ml-4"
                    onClick={() => handleUnsave()}
                  />
                  <p className="ml-1 text-ui-50 text-place font-light font-lexend">
                    {savedCountLoading ? "" : savedCount > 0 && savedCount}
                  </p>
                </div>

                <ShareButton
                  noBg={true}
                  height={18}
                  width={18}
                  postId={post.id}
                  username={post.created_by}
                  style="w-4 h-4"
                />
              </div>
            )}
            {post.comments && (
              <>
                <div className={`my-3`}></div>

                <article className="flex gap-1 items-start px-3">
                  <button className="rounded-full border-solid border-[.8px] border-ui-90 bg-white w-7 h-7 flex items-center justify-center overflow-hidden">
                    {post.comments.user.profile_picture_url ? (
                      <img
                        src={`${
                          import.meta.env.VITE_SUPABASE_URL
                        }/storage/v1/object/public/img/${
                          post.comments.user.profile_picture_url
                        }`}
                        alt="user image"
                        className="h-full w-full object-cover rounded-full"
                      />
                    ) : (
                      <img src="/assets/profile.svg" alt="logo image" />
                    )}
                  </button>
                  <div className="flex flex-col grow shrink-0 px-[3px] basis-0 w-fit mt-[4px]">
                    <div className="flex gap-1.5 items-baseline">
                      <p className="text-[8px] font-semibold text-black font-lexend">
                        @{post.comments.user.username}
                      </p>
                      <p className="flex-auto text-[8px] font-light text-violet-500 text-[#8e52da]">
                        {timeAgo(new Date(post.comments.created_at))}
                      </p>
                    </div>
                    <p className=" text-[10px] text-neutral-500 font-lexend">
                      {post.comments.content}
                    </p>
                    {post.comments?.user_id !== authenticatedUserId && (
                      <div className="flex justify-start items-center mt-1">
                        <img
                          src="/assets/saved_icon.svg"
                          alt="saved icon"
                          height={12}
                          width={12}
                          onClick={() => handleCommentUnsave()}
                        />
                        <p className="ml-1 text-ui-50 text-place font-light font-lexend">
                          {savedCommentsCountLoading
                            ? "Loading..."
                            : savedCommentsCount !== 0 && savedCommentsCount}
                        </p>
                      </div>
                    )}
                  </div>
                </article>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export const ActivityMessage = ({
  post,
  authenticatedUserId,
}: {
  post: Post;
  authenticatedUserId: string;
}): ReactElement => {
  const navigate = useNavigate();

  const onMessageClick = useCallback(
    () => navigate(`/${post.created_by}?post_id=${post.id}`),
    [navigate, post.created_by, post.id]
  );

  return (
    <VeritcalyExpandedMessage
      post={post}
      onClick={onMessageClick}
      authenticatedUserId={authenticatedUserId}
    />
  );
};
