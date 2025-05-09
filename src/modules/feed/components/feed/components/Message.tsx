import {
  useCallback,
  type ReactElement,
  useState,
  useEffect,
  Fragment,
} from "react";
import { Post } from "../../../types/post";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Transition } from "@headlessui/react";
import { supabase } from "../../../../../lib/supabase";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { ShareButton } from "../../../../../components/ShareButton";

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.substring(0, maxLength - 3)}...`;
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

const DeleteConfirmationModal = ({
  isOpen,
  onCancel,
  onDelete,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onDelete: () => void;
}): ReactElement | null => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 font-lexend">
      <div className="flex flex-col px-7 pt-7 pb-4 text-center bg-white rounded border-0 border-solid shadow-sm border-stone-300 max-w-[300px]">
        <p className="text-[10px] leading-5 text-black ">
          Are you sure you want to delete this post?
        </p>
        <div className="flex gap-5 justify-between mt-5 text-xs leading-4 whitespace-nowrap">
          <button
            className="justify-center px-6 py-2 text-black rounded-lg border-[1px] border-black border-solid"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="justify-center px-7 py-2 text-white bg-[#F14A58] rounded"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const ReportModal = ({
  isOpen,
  onCancel,
  onReport,
  reportReason,
  setReportReason,
}: {
  isOpen: boolean;
  onCancel: () => void;
  onReport: () => void;
  reportReason: string;
  setReportReason: (reason: string) => void;
}): ReactElement | null => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 font-lexend">
      <div className="flex flex-col px-7 pt-7 pb-4 bg-white rounded border-0 border-solid shadow-sm border-stone-300 max-w-[300px]">
        <h2 className="text-lg font-semibold mb-2 text-center">Report Post</h2>
        <p className="text-[10px] mb-4">
          Are you sure you want to report this post? Please tell us why:
        </p>
        <textarea
          className="w-full p-2 text-xs leading-4 text-black border-1 border-stone-300 rounded resize-none focus:outline-none focus:ring-1 focus:ring-[#F14A58] placeholder-stone-400"
          placeholder="Write your reason here..."
          rows={4}
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
        ></textarea>
        <div className="flex gap-5 justify-between mt-5 text-xs leading-4 whitespace-nowrap">
          <button
            className="justify-center px-6 py-2 text-black rounded-lg border-[1px] border-black border-solid"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className={`justify-center px-7 py-2 rounded ${
              reportReason
                ? "text-white bg-[#F14A58] cursor-pointer"
                : "text-gray-400 bg-gray-200 cursor-not-allowed"
            }`}
            onClick={onReport}
            disabled={!reportReason}
          >
            Report
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

const VeritcalyExpandedMessage = ({
  post,
  onClick,
  onDeletePost,
}: {
  post: Post;
  onClick: () => void;
  onDeletePost: () => void;
}): ReactElement => {
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>("");
  const [isSaved, setIsSaved] = useState(false);
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string>("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [savedCount, setSavedCount] = useState<number>(0);
  const location = useLocation(); // Use the useLocation hook
  const token = localStorage.getItem(import.meta.env.VITE_TOKEN_ID);
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;

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
    const fetchUsername = async () => {
      if (!authenticatedEmail) return;

      const { data: users, error } = await supabase
        .from("users")
        .select("username")
        .eq("email", authenticatedEmail)
        .single();

      if (error) {
        console.error("Error fetching user data:", error.message);
        return;
      }

      if (users?.username) {
        setUsername(users?.username);
      }
    };

    fetchUsername();
  }, [authenticatedEmail, username]);

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

  const {
    data: savedCountData,
    isLoading: savedCountLoading,
    refetch: refetchSavedCount,
  } = useQuery({
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

  useEffect(() => {
    if (savedCountData !== undefined) {
      setSavedCount(savedCountData);
    }
  }, [savedCountData]);

  const { refetch: refetchSavedStatus } = useQuery({
    queryFn: async () => {
      if (!post.id || !authenticatedUserId) {
        throw new Error("Post ID and authenticated user ID are required");
      }
      const { data, error } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", authenticatedUserId)
        .eq("post_id", post.id)
        .eq("is_post", true)
        .maybeSingle();

      if (error) {
        console.error("Error fetching saved status:", error.message);
        return;
      }

      // Only set isSaved if a record is found
      data && data.comment_id === null ? setIsSaved(true) : setIsSaved(false);
    },
    queryKey: ["FETCH_SAVED_STATUS", authenticatedUserId, post.id],
  });

  useEffect(() => {
    refetchSavedStatus(); // Refetch saved status on URL change
    refetchSavedCount(); // Refetch saved count on URL change
  }, [
    location.pathname,
    location.search,
    refetchSavedStatus,
    refetchSavedCount,
  ]);

  const handleSave = async () => {
    if (!authenticatedUserId) {
      navigate(`/signup`);
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
    refetchSavedStatus();
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
    refetchSavedStatus();
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const confirmReport = () => {
    onReportPost();
    setIsReportModalOpen(false);
    setReportReason("");
  };

  const handleReport = () => {
    setIsReportModalOpen(true);
  };

  const cancelReport = () => {
    setIsReportModalOpen(false);
    setReportReason("");
  };
  const onReportPost = async () => {
    try {
      const { error } = await supabase.from("reports").insert([
        {
          post_id: post.id,
          reported_by: username,
          reason: reportReason,
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error("Error reporting post:", error);
    } finally {
      setIsReportModalOpen(false);
    }
  };
  const confirmDelete = () => {
    onDeletePost();
    setIsDeleteModalOpen(false);
  };
  const navigate = useNavigate();
  const onCommentClick = useCallback(() => {
    if (authenticatedEmail) {
      navigate(`/${post.created_by}?post_id=${post.id}`);
    } else {
      navigate(`/signup`);
    }
  }, [navigate, post.created_by, post.id, authenticatedEmail]);

  return (
    <>
      {post.video_url || post.image_url ? (
        <div
          className={`h-full w-full flex flex-col cursor-pointer pb-5 rounded-3xl shadow-lg border-ui-5 border-1`}
        >
          {post.video_url ? (
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
              <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black via-black/50 to-transparent rounded-t-3xl" />
              <div className="absolute bottom-0 left-[14px] w-[85%] bg-white p-1 px-2 rounded-lg text-[10px] mb-4 font-lexend">
                <p className="text-black">{truncateText(post.caption, 50)}</p>
              </div>
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
              {authenticatedEmail && (
                <div className="flex flex-row justify-between items-center absolute top-2 right-3">
                  <Menu as="div" className="relative ">
                    <Menu.Button className="p-1 rounded-full">
                      <img
                        src={"/assets/3dot.svg"}
                        alt="edit_buttton"
                        // className="ml-[40px]"
                      />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 w-24 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        {post.created_by === username && (
                          <div className="p-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={handleDelete}
                                  className={`${
                                    active ? "bg-gray-100" : ""
                                  } group flex rounded-md items-center w-full px-2 py-1 text-sm text-red-500`}
                                >
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        )}
                        {post.created_by !== username && (
                          <div className="p-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={handleReport}
                                  className={`${
                                    active ? "bg-gray-100" : ""
                                  } group flex rounded-md items-center w-full px-2 py-1 text-sm text-red-500`}
                                >
                                  Report
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        )}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <img
                src={`https://wandergals.s3.ap-south-1.amazonaws.com/${post.image_url}`}
                className="w-full rounded-3xl rounded-b-none object-cover min-h-52"
                onClick={onClick}
              />
              <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black via-black/50 to-transparent rounded-t-3xl" />
              <div className="absolute bottom-0 left-[14px] w-[85%] bg-white p-1 px-2 rounded-lg text-[10px] mb-4 font-lexend">
                <p className="text-black">{truncateText(post.caption, 50)}</p>
              </div>
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

              {authenticatedEmail && (
                <div className="flex flex-row justify-between items-center absolute top-2 right-3">
                  <Menu as="div" className="relative ">
                    <Menu.Button className="p-1 rounded-full ">
                      <img
                        src={"/assets/3dot.svg"}
                        alt="edit_buttton"
                        // className="ml-[40px]"
                      />
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 w-24 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                        {post.created_by === username && (
                          <div className="p-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={handleDelete}
                                  className={`${
                                    active ? "bg-gray-100" : ""
                                  } group flex rounded-md items-center w-full px-2 py-1 text-sm text-red-500`}
                                >
                                  Delete
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        )}
                        {post.created_by !== username && (
                          <div className="p-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  onClick={handleReport}
                                  className={`${
                                    active ? "bg-gray-100" : ""
                                  } group flex rounded-md items-center w-full px-2 py-1 text-sm text-red-500`}
                                >
                                  Report
                                </button>
                              )}
                            </Menu.Item>
                          </div>
                        )}
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between w-full mt-3 px-5">
            <div className="flex justify-between items-center">
              <img
                src="/assets/comment_icon.svg"
                alt="comment icon"
                height={16}
                width={16}
                onClick={onCommentClick}
              />
              <p
                className="ml-1 text-ui-50 text-place font-light font-lexend"
                onClick={onCommentClick}
              >
                {commentsCountLoading
                  ? "Loading..."
                  : commentsCount !== 0 && commentsCount}
              </p>
              {isSaved ? (
                <img
                  src="/assets/saved_icon.svg"
                  alt="saved icon"
                  height={16}
                  width={16}
                  className="ml-4"
                  onClick={() => handleUnsave()}
                />
              ) : (
                <img
                  src="/assets/save_icon.svg"
                  alt="save icon"
                  height={16}
                  width={16}
                  className="ml-4"
                  onClick={() => handleSave()}
                />
              )}
              <p className="ml-1 text-ui-50 text-place font-light font-lexend">
                {savedCountLoading
                  ? "Loading..."
                  : savedCount > 0 && savedCount}
              </p>
            </div>
            <ShareButton
              noBg={true}
              postId={post.id}
              height={16}
              width={16}
              username={post.created_by}
            />
          </div>
        </div>
      ) : null}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onCancel={cancelDelete}
        onDelete={confirmDelete}
      />
      <ReportModal
        isOpen={isReportModalOpen}
        onCancel={cancelReport}
        onReport={confirmReport}
        reportReason={reportReason}
        setReportReason={setReportReason}
      />
    </>
  );
};

export const Message = ({ post }: { post: Post }): ReactElement => {
  const navigate = useNavigate();

  const onMessageClick = useCallback(
    () => navigate(`/${post.created_by}?post_id=${post.id}`),
    [navigate, post.created_by, post.id]
  );

  const handleDelete = useCallback(async () => {
    const { error } = await supabase
      .from("posts")
      .delete()
      .match({ id: post.id });

    if (error) {
      console.error("Error deleting post:", error.message);
      return;
    }

    window.location.reload();
  }, [post.id]);

  return (
    <VeritcalyExpandedMessage
      post={post}
      onClick={onMessageClick}
      onDeletePost={handleDelete}
    />
  );
};
