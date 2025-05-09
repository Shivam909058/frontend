import { IconButton } from "@material-tailwind/react";
import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useIntersectionObserver } from "../../../../hooks/useIntersectionObserver";
import { ActivityMessage } from "./components/ActivityMessage";
import type { Post } from "../../types/post";
import { supabase } from "../../../../lib/supabase";
import { Spinner } from "@material-tailwind/react";
import { useNavigate } from "react-router-dom";

// const estimatePostHeight = (post: Post) => {
//   const baseHeight = 200;
//   const descriptionLengthFactor = 0.5;
//   return (
//     baseHeight +
//     post.description.length * descriptionLengthFactor +
//     (post.image_url ? 100 : 0)
//   );
// };

const useFeedInfiniteQuery = ({
  authenticatedUserId,
}: {
  authenticatedUserId: string;
}) => {
  return useInfiniteQuery({
    queryFn: async ({ pageParam = 1 }) => {
      const { data, error } = await supabase
        .from("activities")
        .select(
          `
                    posts(
                       *,
                       comments(
                         id, 
                         content, 
                         created_at, 
                         user_id,
                         user:users(username, profile_picture_url) 
                       )
                    ),
                    comments(
                       id, 
                       content, 
                       created_at, 
                       user_id,
                       user:users(username, profile_picture_url)
                    )
                   `
        )
        .eq("user_id", authenticatedUserId)
        .order("created_at", { ascending: false })
        .limit(10)
        .range((pageParam - 1) * 10, pageParam * 10 - 1);

      if (error) throw error;

      // Restructure the data
      const restructuredData = data.map((item) => {
        // Spread the values of 'posts' inside the object itself
        const { posts, ...rest } = item;
        return {
          ...posts, // Spread the values of 'posts'
          ...rest, // Keep the rest of the properties
        };
      });

      return restructuredData;
    },
    getNextPageParam: (lastPage, allPages) => {
      const nextPage = lastPage.length ? allPages.length + 1 : undefined;
      return nextPage;
    },
    queryKey: ["feed", authenticatedUserId],
    initialPageParam: 1,
  });
};

function Activity() {
  const [columns, setColumns] = useState<{ left: Post[]; right: Post[] }>({
    left: [],
    right: [],
  });
  const [authenticatedUserId, setAuthenticatedUserId] = useState<string>("");
  const { data, status, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useFeedInfiniteQuery({ authenticatedUserId });

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
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    if (!data) return;

    const newColumns = { left: [] as Post[], right: [] as Post[] };
    data.pages.flat().forEach((post, index) => {
      if (index % 2 === 0) {
        newColumns.left.push(post as unknown as Post);
      } else {
        newColumns.right.push(post as unknown as Post);
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
    return <p>Something went wrong!</p>;
  }
  return (
    <div className="px-2 pt-9">
      <div className="flex flex-row gap-3 items-center">
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
          Your Activity{" "}
        </h1>
      </div>
      {data?.pages[0].length ? (
        <div className="flex gap-4 mt-5">
          {Object.values(columns).map((column, i) => (
            <div key={i} className="w-1/2 space-y-4">
              {column.map((post, index) => (
                <div ref={index === column.length - 1 ? setRef : undefined} key={post.id}>
                  <ActivityMessage
                    post={post}
                    authenticatedUserId={authenticatedUserId}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <p className="grid place-items-center w-full h-72 font-lexend text-[12px]">
          No activities
        </p>
      )}
      {isFetchingNextPage && (
        <div className="flex items-center justify-center mt-2">
          <Spinner
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
        </div>
      )}
    </div>
  );
}

export default Activity;
