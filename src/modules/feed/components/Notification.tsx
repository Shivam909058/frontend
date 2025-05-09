import { useEffect, useState } from "react";
import { IconButton, Spinner } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";

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

function Notification() {
  const navigate = useNavigate();
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string | null>(
    null
  );
  const [authenticatedUserName, setAuthenticatedUserName] = useState<
    string | null
  >(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLocalStorageSupported = isLocalStorageAvailable();
    const token = isLocalStorageSupported
      ? localStorage.getItem(import.meta.env.VITE_TOKEN_ID)
      : null;
    const parsedToken = token ? JSON.parse(token) : null;
    const authenticatedEmail = parsedToken?.user?.email;

    const fetchAuthenticatedUserId = async () => {
      if (!authenticatedEmail) return;

      const { data, error } = await supabase
        .from("users")
        .select("id, username")
        .eq("email", authenticatedEmail)
        .single();

      if (error) {
        console.error("Error fetching user id:", error.message);
        return;
      }

      setAuthenticatedUserId(data?.id);
      setAuthenticatedUserName(data?.username);
    };

    fetchAuthenticatedUserId();
  }, []);

  useEffect(() => {
    if (!authenticatedUserId) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("trigger_user_id", authenticatedUserId)
        .neq("user_id", authenticatedUserId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error.message);
        setLoading(false);
        return;
      }

      // Fetch image URLs and usernames for notifications with post_id
      const notificationsWithDetails = await Promise.all(
        data.map(async (notification) => {
          let newNotification = { ...notification };

          // Fetch post image_url if post_id is present
          if (notification.post_id) {
            const { data: post, error: postError } = await supabase
              .from("posts")
              .select("image_url")
              .eq("id", notification.post_id)
              .single();

            if (postError) {
              console.error("Error fetching post:", postError.message);
            } else {
              newNotification = {
                ...newNotification,
                image_url: post?.image_url,
              };
            }
          }

          // Fetch user username and profile_picture_url
          if (notification.trigger_user_id) {
            const { data: user, error: userError } = await supabase
              .from("users")
              .select("username")
              .eq("id", notification.user_id)
              .single();

            if (userError) {
              console.error("Error fetching user:", userError.message);
            } else {
              newNotification = {
                ...newNotification,
                username: user?.username,
              };
            }
          }

          if (notification.action_type === "follow") {
            const { data: user, error: userError } = await supabase
              .from("users")
              .select("profile_picture_url")
              .eq("id", notification.user_id)
              .single();

            if (userError) {
              console.error("Error fetching user:", userError.message);
            } else {
              newNotification = {
                ...newNotification,
                profile_picture_url: user?.profile_picture_url,
              };
            }
          }

          return newNotification;
        })
      );

      setNotifications(notificationsWithDetails);
      setLoading(false);
    };

    fetchNotifications();
  }, [authenticatedUserId]);

  useEffect(() => {
    if (!authenticatedUserId) return;

    const channel = supabase
      .channel("public:notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        async (payload) => {
          if (
            payload.new.trigger_user_id !== authenticatedUserId ||
            payload.new.user_id === authenticatedUserId
          )
            return;

          let newNotification = payload.new;

          // Fetch post image_url if post_id is present
          if (payload.new.post_id) {
            const { data: post, error: postError } = await supabase
              .from("posts")
              .select("image_url")
              .eq("id", payload.new.post_id)
              .single();

            if (postError) {
              console.error("Error fetching post:", postError.message);
            } else {
              newNotification = {
                ...newNotification,
                image_url: post?.image_url,
              };
            }
          }

          // Fetch user username and profile_picture_url
          if (payload.new.user_id) {
            const { data: user, error: userError } = await supabase
              .from("users")
              .select("username, profile_picture_url")
              .eq("id", payload.new.user_id)
              .single();

            if (userError) {
              console.error("Error fetching user:", userError.message);
            } else {
              newNotification = {
                ...newNotification,
                username: user?.username,
                profile_picture_url: user?.profile_picture_url,
              };
            }
          }

          setNotifications((prevNotifications) => [
            newNotification,
            ...prevNotifications,
          ]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authenticatedUserId]);

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.substring(0, maxLength - 3)}...`;
  };

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

  const handleNotificationClick = (notification: any) => {
    if (notification.action_type === "follow") {
      navigate(`/${notification.username}`);
    } else if (
      notification.action_type === "save_post" ||
      notification.action_type === "comment"
    ) {
      navigate(`/${authenticatedUserName}?post_id=${notification.post_id}`);
    } else if (notification.action_type === "save_comment") {
      navigate(`/${notification.username}?post_id=${notification.post_id}`);
    }
  };

  const handleUsernameClick = (username: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent the event from bubbling up to the section's onClick handler
    navigate(`/${username}`);
  };

  return (
    <div className="px-2 pt-9">
      <div className="flex flex-row gap-3 items-center mb-4">
        <IconButton
          variant="outlined"
          placeholder="back button"
          className="rounded-full border-solid"
          size="md"
          style={{ border: "1px solid #000000" }}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
          onClick={() => navigate(-1)}
        >
          <img
            src={"/assets/back_icon.svg"}
            alt="back icon"
            width={12}
            height={12}
          />
        </IconButton>
        <h1 className="text-ui-90 font-lexend font-semibold text-big">
          Notifications
        </h1>
      </div>
      {loading ? (
        <div className="grid place-items-center h-screen">
          <Spinner
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
        </div>
      ) : notifications.length > 0 ? (
        notifications.map((notification) => (
          <section
            key={notification.id}
            className="flex gap-5 justify-between px-3.5 py-3.5 text-[12px] leading-5 bg-white rounded-xl shadow-lg font-lexend mb-2"
            onClick={() => handleNotificationClick(notification)}
            style={{ cursor: "pointer" }}
          >
            <article
              className={`flex flex-col self-start ${
                notification.image_url || notification.action_type === "follow"
                  ? "mt-2"
                  : ""
              }`}
            >
              <header className="flex gap-1.5">
                <p
                  className="grow font-medium text-[#8E52DA] cursor-pointer"
                  onClick={(event) =>
                    handleUsernameClick(notification.username, event)
                  }
                >
                  @
                  {(notification.action_type === "comment" &&
                    notification.image_url) ||
                  notification.action_type === "save_comment"
                    ? truncateText(notification.username, 10)
                    : notification.username}
                </p>
                <p className="flex-auto text-slate-900">
                  {notification.action_type === "comment" &&
                    "commented on your post :"}
                  {notification.action_type === "save_post" &&
                    "saved your post."}
                  {notification.action_type === "save_comment" &&
                    "saved your comment."}
                  {notification.action_type === "follow" &&
                    "started following you."}
                </p>
                {notification.action_type !== "comment" && (
                  <p className="flex-auto text-[10px] font-light text-[#86818c] ml-3 ">
                    {timeAgo(new Date(notification.created_at))}
                  </p>
                )}
              </header>
              <p className="flex text-slate-900 items-center justify-center">
                {notification.action_type === "comment" && (
                  <>
                    <span className="">
                      {truncateText(notification.action_description, 20)}{" "}
                    </span>
                    <p className="flex-auto text-[10px] font-light text-[#86818c] ml-3 mt-[2px]">
                      {timeAgo(new Date(notification.created_at))}
                    </p>
                  </>
                )}
              </p>
            </article>
            {notification.image_url &&
              notification.action_type !== "follow" && (
                <img
                  loading="lazy"
                  src={`https://wandergals.s3.ap-south-1.amazonaws.com/${notification.image_url}`}
                  alt="Image related to the post"
                  className="shrink-0 aspect-square w-[41px] rounded-lg"
                />
              )}
            {notification.action_type === "follow" && (
              <img
                loading="lazy"
                src={
                  notification.profile_picture_url
                    ? `${
                        import.meta.env.VITE_SUPABASE_URL
                      }/storage/v1/object/public/img/${
                        notification.profile_picture_url
                      }`
                    : "/assets/profile.svg"
                }
                alt="Profile picture of the user who followed you"
                className={`shrink-0 object-cover w-[42px] h-[42px] rounded-lg ${
                  notification.profile_picture_url
                    ? ""
                    : "border-[1px] border-[#7e7d7d]"
                }`}
              />
            )}
          </section>
        ))
      ) : (
        <div className="grid place-items-center h-screen">
          <p className="font-lexend">No new notifications</p>
        </div>
      )}
    </div>
  );
}

export default Notification;
