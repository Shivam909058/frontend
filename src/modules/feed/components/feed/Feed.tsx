import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import { Message } from "./components/Message";
import type { ReactElement } from "react";
import type { Post } from "../../types/post";
import { supabase } from "../../../../lib/supabase";
import { Spinner } from "@material-tailwind/react";
import { EmptyFeed } from "./EmptyFeed";
import { useNavigate } from "react-router-dom";

const useFeedInfiniteQuery = ({ userName, isLoggedInUserFeed }: { userName: string, isLoggedInUserFeed: boolean }) => {
  return useInfiniteQuery({
    queryFn: async ({ pageParam = 1 }) => {
      let query = supabase
        .from("posts")
        .select("*")
        .eq("created_by", userName)
        .order("created_at", { ascending: false })
        .limit(10)
        .range((pageParam - 1) * 10, pageParam * 10 - 1);

      if (!isLoggedInUserFeed) {
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.length ? allPages.length + 1 : undefined;
      return nextPage;
    },
    queryKey: ["feed", userName, isLoggedInUserFeed],
  });
};

const Feed = ({
  userName,
  isLoggedInUserFeed,
}: {
  userName: string;
  isLoggedInUserFeed: boolean;
}): ReactElement => {
  const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useFeedInfiniteQuery({ userName, isLoggedInUserFeed });
  const [columns, setColumns] = useState<{ left: Post[]; right: Post[] }>({
    left: [],
    right: [],
  });
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const navigate = useNavigate();
  const [isBlockedUser, setIsBlockedUser] = useState<boolean>(false);
  const [showUnblockButton, setShowUnblockButton] = useState<boolean>(false);
  const [authenticatedUsername, setAuthenticatedUsername] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
    const parsedToken = token ? JSON.parse(token) : null;
    const authenticatedEmail = parsedToken?.user?.email;
    
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
        setAuthenticatedUsername(users.username);
      }
    };

    fetchUsername();
  }, []);

  useEffect(() => {
    const checkIfBlockedUser = async () => {
      const { data, error } = await supabase
        .from("blocked_users")
        .select("*")
        .eq("blocked_username", userName)
        .eq("blocker_username", authenticatedUsername)
        .single();

      if (error) {
        console.error("Error checking blocked user:", error.message);
        return;
      }

      setIsBlockedUser(!!data);
      setShowUnblockButton(!!data);
    };

    if (authenticatedUsername) {
      checkIfBlockedUser();
    }
  }, [userName, authenticatedUsername]);

  const handleUnblock = async () => {
    const { error } = await supabase
      .from("blocked_users")
      .delete()
      .eq("blocked_username", userName)
      .eq("blocker_username", authenticatedUsername);

    if (error) {
      console.error("Error unblocking user:", error.message);
    } else {
      setIsBlockedUser(false);
      setShowUnblockButton(false);
      window.location.reload()
    }
  };

  // Render blocked user message and button
  const renderBlockedUserMessage = () => (
    <div className="flex flex-col items-center justify-center font-lexend">
      <p>You have blocked this user.</p>
      {showUnblockButton && (
        <button onClick={handleUnblock} className="bg-orange py-2 px-7 h-10 border-0 rounded-md text-warning-1 mt-5 font-lexend font-normal">
          Unblock
        </button>
      )}
    </div>
  );

  // Ensure all hooks are called before returning
  useEffect(() => {
    if (!data) return;

    const newColumns = { left: [] as Post[], right: [] as Post[] };
    data.pages.flat().forEach((post, index) => {
      if (index % 2 === 0) {
        newColumns.left.push(post as Post);
      } else {
        newColumns.right.push(post as Post);
      }
    });

    setColumns(newColumns);
  }, [data?.pages]);

  const { setRef } = useIntersectionObserver({
    onIntersection: (entry) =>
      entry.isIntersecting && hasNextPage && fetchNextPage(),
  });

  useEffect(() => {
    const fetchUserIdAndNotifications = async () => {
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("username", userName)
        .single();

      if (userError) {
        console.error("Error fetching user id:", userError.message);
        return;
      }

      const userId = userData?.id;

      const fetchInitialNotificationCount = async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("trigger_user_id", userId)
          .neq("user_id", userId)
          .eq("is_read", false);

        if (error) {
          console.error("Error fetching notifications:", error.message);
          return;
        }

        setNotificationCount(data.length);
      };

      fetchInitialNotificationCount();

      const channel = supabase
        .channel("public:notifications")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "notifications" },
          (payload) => {
            if (
              payload.new.trigger_user_id === userId &&
              payload.new.user_id !== userId &&
              !payload.new.is_read
            ) {
              setNotificationCount((prevCount) => prevCount + 1);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchUserIdAndNotifications();
  }, [userName]);

  const handleNotificationsClick = async () => {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("username", userName)
      .single();

    if (userError) {
      console.error("Error fetching user id:", userError.message);
      return;
    }

    const userId = userData?.id;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("trigger_user_id", userId);

    if (error) {
      console.error("Error updating notifications:", error.message);
    }

    navigate("/notifications");
  };

  // Render logic
  if (status === "pending") {
    return (
      <div className="grid place-items-center h-screen">
        <Spinner
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
      </div>
    );
  }

  if (status === "error") {
    return <p>Something went wrong!</p>;
  }

  if (isBlockedUser) {
    return renderBlockedUserMessage();
  }

  return (
    <>
      {isLoggedInUserFeed && (
        <div className="flex justify-between">
          <div
            className="flex gap-2 px-7 py-2.5 text-[12px] leading-tight text-black bg-[#ebeff5] rounded-xl items-center justify-center font-lexend w-[48%]"
            onClick={() => navigate("/activities")}
          >
            <img
              src="/assets/save_icon.svg"
              alt="share icon"
              height={14}
              width={14}
            />
            <p className="self-start">Your Activity</p>
          </div>
          <div
            className="flex gap-2 px-7 py-2.5 text-[12px] leading-tight text-black bg-[#ebeff5] rounded-xl items-center justify-center font-lexend  w-[48%] relative"
            onClick={handleNotificationsClick}
          >
            <img
              src="/assets/notification_icon.svg"
              alt="notification icon"
              height={14}
              width={14}
            />
            <p className="self-start">Notifications</p>
            {notificationCount > 0 && (
              <span className="flex items-center justify-center rounded-full w-[20px] h-[20px] p-[6px] bg-[#ff0000] text-white text-[10px] absolute top-[-8px] right-[-8px]">
                {notificationCount}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex gap-4">
        {Object.values(columns).map((column, i) => (
          <div key={i} className="w-1/2 space-y-4">
            {column.map((post, index) => (
              <div
                ref={index === column.length - 1 ? setRef : undefined}
                key={post.id}
              >
                <Message post={post} />
              </div>
            ))}
          </div>
        ))}
      </div>
      {isFetchingNextPage && (
        <div className="flex items-center justify-center mt-2">
          <Spinner
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
        </div>
      )}
      {!data?.pages.flat().length && isLoggedInUserFeed && <EmptyFeed />}
      {!data?.pages.flat().length && !isLoggedInUserFeed && (
        <div className="h-full grid place-items-center">No posts</div>
      )}
    </>
  );
};

export { Feed };