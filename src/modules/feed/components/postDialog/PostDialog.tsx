import { Dialog, DialogBody, Spinner } from "@material-tailwind/react";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { ShareButton } from "../../../../components/ShareButton";
import { supabase } from "../../../../lib/supabase";
import LocationSVG from "../../../../assets/location_icon";
import LinkSVG from "../../../../assets/link_icon";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CommentDrawer } from "./CommentDrawer";

function isLocalStorageAvailable() {
  const testKey = "test";
  try {
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

interface SavedCommentsMap {
  [key: string]: boolean;
}

interface Comment {
  id: string; // Assuming UUID is represented as a string in TypeScript
  postId: string; // Reference to Posts table, hence using string to represent UUID
  user_id: string; // Reference to Users table, hence using string to represent UUID
  parent_comment_id: string | null; // Can be null for top-level comments or string for replies
  content: string; // Content of the comment
  created_at: Date; // Date when the comment was created
  user: {
    username: string;
    profile_picture_url: string | null;
  } | null;
}

const usePostQuery = ({ postId }: { postId?: string }) =>
  useQuery({
    queryFn: async () => {
      if (!postId) throw new Error("Post ID is required");
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw error;
      return data;
    },
    queryKey: ["POST", postId],
  });

const useCommentsQuery = ({
  postId,
  username,
}: {
  postId?: string;
  username: string | null;
}) =>
  useQuery({
    queryFn: async () => {
      if (!postId) throw new Error("Post ID is required");

      let blockedUsernames: string[] = [];

      if (username) {
        const { data: blockedUsers, error: blockedError } = await supabase
          .from("blocked_users")
          .select("blocked_username")
          .eq("blocker_username", username);

        if (blockedError) {
          console.error("Error fetching blocked users:", blockedError);
        } else {
          blockedUsernames = blockedUsers.map((user) => user.blocked_username);
        }
      }

      let query = supabase
        .from("comments")
        .select(
          `
            *,
            user:user_id (
              username,
              profile_picture_url
            )
          `
        )
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (blockedUsernames.length > 0) {
        query = query.not(
          "user.username",
          "in",
          `(${blockedUsernames.join(",")})`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data.filter((comment) => comment.user !== null);
    },
    queryKey: ["COMMENTS", postId, username],
  });

const truncateUrl = (url: string, maxLength = 20) => {
  if (url.length > maxLength) {
    return url.substring(0, maxLength) + "...";
  }
  return url;
};

const ensureHttpPrefix = (url: string) => {
  if (!url) return url; // Return the original url if it's falsy
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return `https://${url}`;
  }
  return url;
};

export const PostDialog = ({
  postId,
  onClose,
}: {
  postId?: string;
  onClose: () => void;
}) => {
  const [commentContent, setCommentContent] = useState("");
  const [replyContext, setReplyContext] = useState({
    active: false,
    username: "",
    parentId: null as string | null,
  });
  const [expandedComments, setExpandedComments] = useState<Set<string>>(
    new Set()
  );
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const { username } = useParams();
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>("");
  const [isSaved, setIsSaved] = useState(false);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string>("");
  const [savedCount, setSavedCount] = useState<number>(0);
  const [savedComments, setSavedComments] = useState<{
    [key: string]: boolean;
  }>({});
  const [savedCommentsCount, setSavedCommentsCount] = useState<{
    [key: string]: number;
  }>({});
  const navigate = useNavigate();

  const [authenticatedUsername, setAuthenticatedUsername] = useState<
    string | null
  >(null);

  const isLocalStorageSupported = isLocalStorageAvailable();
  const token = isLocalStorageSupported
    ? localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`)
    : null;
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;

  useEffect(() => {
    const fetchAuthenticatedUsername = async () => {
      if (!authenticatedEmail) return;

      const { data, error } = await supabase
        .from("users")
        .select("username")
        .eq("email", authenticatedEmail)
        .single();

      if (error) {
        console.error("Error fetching authenticated username:", error.message);
        return;
      }

      setAuthenticatedUsername(data?.username);
    };

    fetchAuthenticatedUsername();
  }, [authenticatedEmail]);

  useEffect(() => {
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
  }, [authenticatedEmail]);

  useEffect(() => {
    const fetchSavedStatus = async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", authenticatedUserId)
        .eq("post_id", postId)
        .eq("is_post", true)
        .single();

      if (error) {
        console.error("Error fetching saved status:", error.message);
        return;
      }

      data && data.comment_id === null ? setIsSaved(true) : setIsSaved(false);
    };
    if (postId) {
      fetchSavedStatus();
    }
  }, [postId, authenticatedUserId]);

  useEffect(() => {
    const fetchSavedCount = async () => {
      const { data, error } = await supabase
        .from("activities")
        .select("*", { count: "exact" })
        .eq("post_id", postId)
        .eq("is_post", true);

      if (error) {
        console.error("Error fetching saved count:", error.message);
        return;
      }

      setSavedCount(data.length);
    };

    if (postId) {
      fetchSavedCount();
    }
  }, [postId]);

  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useCommentsQuery({ postId, username: authenticatedUsername });

  const parentIds = new Set(
    comments
      ?.map((comment) => comment.parent_comment_id)
      .filter((id) => id !== null)
  );

  useEffect(() => {
    const fetchSavedStatusForComments = async () => {
      if (!authenticatedUserId || !(comments?.length ?? 0 > 0)) return;
      const { data, error } = await supabase
        .from("activities")
        .select("comment_id")
        .eq("user_id", authenticatedUserId)
        .in("comment_id", comments?.map((comment) => comment.id) ?? []);

      if (error) {
        console.error("Error fetching saved status:", error.message);
        return;
      }

      const savedMap = data.reduce<SavedCommentsMap>((acc, { comment_id }) => {
        acc[comment_id] = true;
        return acc;
      }, {});

      setSavedComments(savedMap);
    };

    const fetchSavedCountsForComments = async () => {
      if (!comments?.length) return;
      const { data, error } = await supabase
        .from("activities")
        .select("comment_id", { count: "exact" })
        .in("comment_id", comments?.map((comment) => comment.id) ?? [])
        .eq("is_post", false);

      if (error) {
        console.error(
          "Error fetching saved counts for comments:",
          error.message
        );
        return;
      }

      const savedCountMap = data.reduce<{ [key: string]: number }>(
        (acc, { comment_id }) => {
          acc[comment_id] = (acc[comment_id] || 0) + 1;
          return acc;
        },
        {}
      );

      setSavedCommentsCount(savedCountMap);
    };

    fetchSavedStatusForComments();
    fetchSavedCountsForComments();
  }, [comments, authenticatedUserId]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("profile_picture_url")
        .eq("username", username)
        .single();

      if (error) {
        console.error("Error fetching user data:", error.message);
        return;
      }

      setProfilePictureUrl(data?.profile_picture_url);
    };

    fetchProfile();
  }, [username]);

  const fetchUserId = async (email: string) => {
    const { data, error } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (error) throw error;
    return data.id;
  };

  const handleCommentClick = async () => {
    if (commentContent.trim() === "") return;
    try {
      const userId = await fetchUserId(authenticatedEmail);
      await postComment(userId, commentContent);
      setCommentContent("");
      refetchComments();
    } catch (error) {
      console.error("Failed to post comment:", error);
    }
  };

  const handleSaveComment = async (commentId: string) => {
    if (!authenticatedUserId) {
      navigate("/signup");
      return;
    }
    // Insert activity
    const { error: activitiesError } = await supabase
      .from("activities")
      .insert([
        {
          user_id: authenticatedUserId,
          comment_id: commentId,
          post_id: postId,
          is_post: false,
        },
      ]);

    if (activitiesError) {
      console.error("Failed to save comment:", activitiesError.message);
      return;
    }

    // Fetch the user ID of the comment's owner
    const { data: commentData, error: commentError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (commentError) {
      console.error("Failed to fetch comment owner:", commentError.message);
      return;
    }

    const triggerUserId = commentData.user_id;

    // Insert notification
    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: authenticatedUserId,
          trigger_user_id: triggerUserId,
          action_type: "save_comment",
          post_id: postId,
        },
      ]);

    if (notificationError) {
      console.error(
        "Failed to create notification:",
        notificationError.message
      );
      return;
    }

    setSavedComments((prev) => ({ ...prev, [commentId]: true }));
    setSavedCommentsCount((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) + 1,
    }));
  };

  const handleSave = async () => {
    if (!authenticatedUserId) {
      navigate("/signup");
      return;
    }
    const { error: activitiesError } = await supabase
      .from("activities")
      .insert([
        {
          user_id: authenticatedUserId,
          post_id: post.id,
          comment_id: null,
          is_post: true,
        },
      ]);

    if (activitiesError) {
      console.error("Error saving activity:", activitiesError.message);
      return;
    }

    // Fetch trigger user ID
    const { data: triggerUserData, error: triggerUserError } = await supabase
      .from("users")
      .select("id")
      .eq("username", post.created_by)
      .single();

    if (triggerUserError) throw triggerUserError;

    const triggerUserId = triggerUserData.id;

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: authenticatedUserId,
          trigger_user_id: triggerUserId,
          action_type: "save_post",
          post_id: post.id,
        },
      ]);

    if (notificationError) {
      console.error(
        "Failed to create notification:",
        notificationError.message
      );
      return;
    }

    setIsSaved(true);
    setSavedCount((prevCount) => prevCount + 1);
  };

  const handleUnsave = async () => {
    const { error } = await supabase
      .from("activities")
      .delete()
      .match({ user_id: authenticatedUserId, post_id: post.id, is_post: true });

    if (error) {
      console.error("Error un-saving activity:", error.message);
      return;
    }

    setIsSaved(false);
    setSavedCount((prevCount) => prevCount - 1);
  };

  const handleUnsaveComment = async (commentId: string) => {
    const { error } = await supabase.from("activities").delete().match({
      user_id: authenticatedUserId,
      comment_id: commentId,
      is_post: false,
    });

    if (error) {
      console.error("Failed to unsave comment:", error.message);
      return;
    }

    setSavedComments((prev) => ({ ...prev, [commentId]: false }));
    setSavedCommentsCount((prev) => ({
      ...prev,
      [commentId]: (prev[commentId] || 0) - 1,
    }));
  };

  const toggleCommentVisibility = (commentId: string) => {
    setExpandedComments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleReplyInit = (username: string, parentId: string | null) => {
    if (!authenticatedEmail) {
      navigate("/signup");
      return;
    }
    setReplyContext({ active: true, username, parentId });
    setIsCommentDrawerOpen(true);
    commentInputRef.current?.focus();
  };

  function timeAgo(date: Date) {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    const interval = Math.floor(seconds / 31536000);
    if (interval > 1) return interval + " years ago";
    if (interval === 1) return interval + " year ago";

    const months = Math.floor(seconds / 2628000);
    if (months > 1) return months + " months ago";
    if (months === 1) return months + " month ago";

    const days = Math.floor(seconds / 86400);
    if (days > 1) return days + " days ago";
    if (days === 1) return days + " day ago";

    const hours = Math.floor(seconds / 3600);
    if (hours > 1) return hours + " hours ago";
    if (hours === 1) return hours + " hour ago";

    const minutes = Math.floor(seconds / 60);
    if (minutes > 1) return minutes + " minutes ago";
    if (minutes === 1) return minutes + " minute ago";

    return "just now";
  }

  const useCommentsCountQuery = ({ postId }: { postId?: string }) =>
    useQuery({
      queryFn: async () => {
        if (!postId) {
          throw new Error("Post ID is required");
        }
        const { data, error } = await supabase
          .from("comments")
          .select("*", { count: "exact" })
          .eq("post_id", postId);

        if (error) throw error;
        return data.length || 0;
      },
      queryKey: ["COMMENTS_COUNT", postId],
    });

  const {
    data: commentsCount,
    isLoading: commentsCountLoading,
    refetch: refetchCommentsCount,
  } = useCommentsCountQuery({ postId });

  const postComment = async (userId: string, content: string) => {
    const { data: commentData, error: commentsError } = await supabase
      .from("comments")
      .insert([
        {
          post_id: postId,
          user_id: userId,
          content: content,
          parent_comment_id: replyContext.active ? replyContext.parentId : null,
        },
      ])
      .select();

    if (commentsError) throw commentsError;

    const { error: activitiesError } = await supabase
      .from("activities")
      .insert([
        {
          post_id: postId,
          user_id: userId,
          comment_id: commentData[0].id,
        },
      ]);
    if (activitiesError) throw activitiesError;

    // Fetch trigger user ID
    const { data: triggerUserData, error: triggerUserError } = await supabase
      .from("users")
      .select("id")
      .eq("username", post.created_by)
      .single();

    if (triggerUserError) throw triggerUserError;

    const triggerUserId = triggerUserData.id;

    const { error: notificationError } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: userId,
          trigger_user_id: triggerUserId,
          action_type: "comment",
          action_description: content,
          post_id: postId,
        },
      ]);

    if (notificationError) throw notificationError;

    setCommentContent("");
    setReplyContext({ active: false, username: "", parentId: null }); // Reset reply context
    refetchCommentsCount();
    refetchComments(); // Refetch comments after posting a comment
  };

  const {
    data: post,
    isLoading: postLoading,
    error,
  } = usePostQuery({ postId });

  const errorData = (error as unknown as AxiosError | undefined)?.response
    ?.data as unknown as { message: string } | undefined;

  const errorMessage = errorData?.message;

  const renderComments = (
    comments: Comment[] = [],
    parentId = null as string | null,
    level = 0,
    visited = new Set<string>()
  ) => {
    // Check if the comments array is empty and return a default "No comments" message
    if (comments.length === 0 && level === 0) {
      return (
        <div className="font-lexend flex justify-center items-center">
          No comments yet.
        </div>
      );
    }

    // Avoid too deep nesting which may not make sense visually and could cause performance issues.
    if (level > 5) return null;

    return comments
      .filter(
        (comment: Comment) =>
          comment.parent_comment_id === parentId &&
          !visited.has(comment.id) &&
          comment.user !== null
      )
      .map((comment) => {
        visited.add(comment.id);
        const isExpanded = expandedComments.has(comment.id);
        const hasReplies = parentIds.has(comment.id);
        return (
          <div
            key={comment.id}
            style={{ marginLeft: `${level * 48}px`, marginTop: `4px` }}
          >
            <article className="flex gap-1.5 items-start mb-8">
              <button className="rounded-full border-solid border-[.8px] border-ui-90 bg-white w-8 h-8 flex items-center justify-center overflow-hidden">
                {comment.user?.profile_picture_url ? (
                  <img
                    src={`${
                      import.meta.env.VITE_SUPABASE_URL
                    }/storage/v1/object/public/img/${
                      comment.user.profile_picture_url
                    }`}
                    alt="user image"
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <img src="/assets/profile.svg" alt="logo image" />
                )}
              </button>
              <div className="flex flex-col grow shrink-0 px-[3px] basis-0 w-fit mt-[-4px]">
                <div className="flex gap-1.5 items-baseline">
                  <p className="text-[12px] font-semibold text-black font-lexend">
                    {comment.user?.username || "Unknown User"}
                  </p>
                  <p className="flex-auto text-[10px] font-light text-violet-500 text-[#8e52da]">
                    {timeAgo(new Date(comment.created_at))}
                  </p>
                </div>
                <p className="text-[10px] text-neutral-500 font-lexend">
                  {comment.content}
                </p>
                <div className="flex justify-start items-center mt-1">
                  {authenticatedUserId !== comment.user_id && (
                    <img
                      src={
                        savedComments[comment.id]
                          ? "/assets/saved_icon.svg"
                          : "/assets/save_icon.svg"
                      }
                      alt={
                        savedComments[comment.id] ? "saved icon" : "save icon"
                      }
                      height={12}
                      width={12}
                      onClick={() => {
                        if (savedComments[comment.id]) {
                          handleUnsaveComment(comment.id);
                        } else {
                          handleSaveComment(comment.id);
                        }
                      }}
                    />
                  )}
                  {authenticatedUserId !== comment.user_id && (
                    <p className="ml-1 text-ui-50 text-place font-light font-lexend">
                      {savedCommentsCount[comment.id] || ""}
                    </p>
                  )}
                  {level <= 0 && (
                    <img
                      src="/assets/reply_icon.svg"
                      alt="reply icon"
                      height={13}
                      width={13}
                      className={`${
                        authenticatedUserId !== comment.user_id ? "ml-3" : ""
                      } cursor-pointer`}
                      onClick={() =>
                        handleReplyInit(
                          comment.user?.username || "Unknown User",
                          comment.id
                        )
                      }
                    />
                  )}
                </div>
                {level <= 0 && hasReplies && (
                  <button
                    onClick={() => toggleCommentVisibility(comment.id)}
                    className="text-[8px] font-lexend text-red-500 text-start mt-2"
                  >
                    {isExpanded ? "hide replies" : "view replies"}
                  </button>
                )}
              </div>
            </article>
            {isExpanded &&
              renderComments(comments, comment.id, level + 1, visited)}
          </div>
        );
      });
  };

  const isLoading = postLoading || commentsLoading || commentsCountLoading;
  useEffect(() => {
    if (postId) {
      commentInputRef.current?.focus();
    }
  }, [postId]);

  return !isLoading ? (
    <Dialog
      open={!!postId}
      size="md"
      handler={onClose}
      placeholder=""
      className="rounded-3xl text-ui-90"
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <div
        className="flex flex-col fixed left-1/2 -translate-x-1/2 bottom-0 bg-white text-ui-90 mx-auto"
        style={{
          width: "100%",
          height: "100%",
        }}
      >
        <DialogBody
          placeholder=""
          className={`flex-1 overflow-y-scroll text-wrap break-words pt-0 px-0 ${
            isCommentDrawerOpen ? "pb-36" : "pb-24"
          } text-justify relative`}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          {error ? (
            <div className="flex items-center justify-center">
              {errorMessage}
            </div>
          ) : (
            post && (
              <div
                className={`flex flex-col w-full ${
                  post.image_url ||
                  post.video_url ||
                  post.web_url ||
                  post.location_url
                    ? "gap-3"
                    : ""
                }`}
              >
                {
                  <div className="relative">
                    {post.image_url && (
                      <>
                        <img
                          src={`https://wandergals.s3.ap-south-1.amazonaws.com/${post.image_url}`}
                          className="w-full object-cover h-[630px]"
                        />
                        <img
                          src="/assets/new_back_icon.svg"
                          alt="back icon"
                          className="absolute top-10 left-4 w-8 h-8 cursor-pointer"
                          onClick={() => navigate(-1)}
                        />
                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black via-black/50 to-transparent rounded-t-3xl" />
                        <div className="flex justify-start items-center absolute bottom-5 left-4">
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
                        <nav className="flex flex-col items-center px-2 py-4 text-xs font-medium text-white whitespace-nowrap bg-black/50 rounded-3xl backdrop-blur-[50px] max-w-[41px] absolute bottom-20 right-3 justify-between h-44">
                          <ShareButton
                            noBg={true}
                            height={18}
                            width={18}
                            postId={postId}
                            username={post.created_by}
                            whiteIcon={true}
                          />
                          <div className="flex flex-col items-center">
                            {isSaved ? (
                              <img
                                src="/assets/saved_icon.svg"
                                alt="saved icon"
                                height={20}
                                width={20}
                                onClick={() => handleUnsave()}
                              />
                            ) : (
                              <img
                                src="/assets/white_save_icon.svg"
                                alt="save icon"
                                height={20}
                                width={20}
                                onClick={() => handleSave()}
                              />
                            )}
                            <p className=" text-white text-place font-normal font-lexend mt-1">
                              {savedCount > 0 && savedCount}
                            </p>
                          </div>
                          <div className="flex flex-col items-center">
                            <img
                              src="/assets/white_comment_icon.svg"
                              alt="comment icon"
                              height={20}
                              width={20}
                              onClick={() => setIsCommentDrawerOpen(true)}
                            />
                            <p className=" text-white text-place font-normal font-lexend mt-1">
                              {commentsCount !== 0 && commentsCount}
                            </p>
                          </div>
                        </nav>
                      </>
                    )}
                    {post.video_url && (
                      <div className="relative">
                        <video
                          className="w-full  object-cover h-[630px]"
                          autoPlay
                          loop
                          // controls
                          playsInline
                          // muted
                        >
                          <source
                            src={`https://wandergals.s3.ap-south-1.amazonaws.com/${post.video_url}`}
                            type="video/mp4"
                          />
                        </video>
                        <img
                          src="/assets/new_back_icon.svg"
                          alt="back icon"
                          className="absolute top-10 left-4 w-8 h-8 cursor-pointer"
                          onClick={() => navigate(-1)}
                        />
                        <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black via-black/50 to-transparent rounded-t-3xl" />
                        <div className="flex justify-start items-center absolute bottom-5 left-4">
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
                        <nav className="flex flex-col items-center px-2 py-4 text-xs font-medium text-white whitespace-nowrap bg-black/50 rounded-3xl backdrop-blur-[50px] max-w-[41px] absolute bottom-20 right-3 justify-between h-44">
                          <ShareButton
                            noBg={true}
                            height={18}
                            width={18}
                            postId={postId}
                            username={post.created_by}
                            whiteIcon={true}
                          />
                          <div className="flex flex-col items-center">
                            {isSaved ? (
                              <img
                                src="/assets/saved_icon.svg"
                                alt="saved icon"
                                height={20}
                                width={20}
                                onClick={() => handleUnsave()}
                              />
                            ) : (
                              <img
                                src="/assets/white_save_icon.svg"
                                alt="save icon"
                                height={20}
                                width={20}
                                onClick={() => handleSave()}
                              />
                            )}
                            <p className=" text-white text-place font-normal font-lexend mt-1">
                              {savedCount > 0 && savedCount}
                            </p>
                          </div>
                          <div className="flex flex-col items-center">
                            <img
                              src="/assets/white_comment_icon.svg"
                              alt="comment icon"
                              height={20}
                              width={20}
                              onClick={() => setIsCommentDrawerOpen(true)}
                            />
                            <p className=" text-white text-place font-normal font-lexend mt-1">
                              {commentsCount !== 0 && commentsCount}
                            </p>
                          </div>
                        </nav>
                      </div>
                    )}
                  </div>
                }

                <div className="px-4">
                  <div
                    className="text-card font-lexend font-[450] post-description"
                    dangerouslySetInnerHTML={{ __html: post.caption }}
                  />
                  <div className="flex flex-row justify-start mt-2">
                    {post.web_url && (
                      <a
                        href={ensureHttpPrefix(post.web_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer"
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        <div
                          className={`text-black font-lexend rounded-xl border-1 border-solid border-gray-200 bg-white underline underline-offset-4 flex justify-between items-center p-2 text-[12px]`}
                        >
                          <p>
                            {truncateUrl(
                              post.web_url_text
                                ? post.web_url_text
                                : post.web_url
                            )}
                          </p>
                          <div className="ml-2">
                            <LinkSVG height="13" width="13" stroke="#FC5A30" />
                          </div>
                        </div>
                      </a>
                    )}
                    {post && post.location_url && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${post.location_url}&query_place_id=${post.place_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`cursor-pointer ${post.web_url && "ml-2"}`}
                        onClick={(event) => {
                          event.stopPropagation();
                        }}
                      >
                        <div
                          className={`text-black font-lexend rounded-xl border-1 border-solid border-gray-200 bg-white flex justify-between items-center p-2 text-[12px]`}
                        >
                          <p>{truncateUrl(post.location_url)}</p>
                          <div className="ml-2">
                            <LocationSVG
                              height="13"
                              width="13"
                              stroke="#FC5A30"
                            />
                          </div>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </DialogBody>
      </div>
      {isCommentDrawerOpen && (
        <CommentDrawer
          close={() => setIsCommentDrawerOpen(false)}
          postId={postId}
          comments={comments}
          commentsLoading={commentsLoading}
          commentContent={commentContent}
          setCommentContent={setCommentContent}
          handleCommentClick={handleCommentClick}
          renderComments={renderComments}
          replyContext={replyContext}
          setReplyContext={setReplyContext}
          authenticatedUserId={authenticatedUserId}
        />
      )}
    </Dialog>
  ) : (
    <Dialog
      open={!!postId}
      size="md"
      handler={onClose}
      placeholder=""
      className="rounded-3xl text-ui-90"
      onPointerEnterCapture={() => {}}
      onPointerLeaveCapture={() => {}}
    >
      <div
        className="flex flex-col fixed left-1/2 -translate-x-1/2 bottom-0 bg-white rounded-3xl rounded-b-none text-ui-90 mx-auto items-center justify-center"
        style={{
          width: "100%",
          maxHeight: "100%",
        }}
      >
        <Spinner
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
      </div>
    </Dialog>
  );
};
