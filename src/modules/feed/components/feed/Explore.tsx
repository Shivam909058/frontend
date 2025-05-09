import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import { Message } from "./components/Message";
import type { ReactElement } from "react";
import type { Post } from "../../types/post";
import { supabase } from "../../../../lib/supabase";
import { Spinner } from "@material-tailwind/react";

const fetchPosts = async ({
  pageParam = 1,
  username,
}: {
  pageParam?: number;
  username: string | null;
}) => {
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
    .from("posts")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (blockedUsernames && blockedUsernames.length > 0) {
    query = query.not("created_by", "in", `(${blockedUsernames.join(",")})`);
  }

  const { data: allPostsData, error: allPostsError } = await query.range(
    (pageParam - 1) * 10,
    pageParam * 10 - 1
  );

  if (allPostsError) throw allPostsError;

  return allPostsData;
};

const Explore = (): ReactElement => {
  const [username, setUsername] = useState<string | null>(null);

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
        setUsername(users?.username);
      }
    };

    fetchUsername();
  }, [username]);

  const {
    data,
    status,
    fetchNextPage,
    isFetchingNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery({
    queryFn: ({ pageParam }) => fetchPosts({ pageParam, username }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.length ? allPages.length + 1 : undefined;
      return nextPage;
    },
    queryKey: ["feed", username],
  });

  const [columns, setColumns] = useState<{ left: Post[]; right: Post[] }>({
    left: [],
    right: [],
  });

  useEffect(() => {
    if (!data) return;

    const uniquePosts = new Set();
    const filteredData = data.pages.flat().filter((post) => {
      if (uniquePosts.has(post.id)) {
        return false;
      } else {
        uniquePosts.add(post.id);
        return true;
      }
    });

    const newColumns = { left: [] as Post[], right: [] as Post[] };
    filteredData.forEach((post, index) => {
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
    return <p>Something went wrong: {error.message}</p>;
  }

  return (
    <>
      <div className="flex gap-2">
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
    </>
  );
};

export { Explore };
