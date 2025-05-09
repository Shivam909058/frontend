import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
// import { Feed } from "../modules/feed/components/feed";
import { FeedHeader } from "../modules/feed/components/feedHeader";
import { PostDialog } from "../modules/feed/components/postDialog";
import { supabase } from "../lib/supabase";
// import ProfileBuckets from "./ProfilePage";

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
interface Bucket {
  id: string;
  name: string;
  prompt: string;
  bio: string;
  by_shakty: boolean;
  shakty_dp: string | null;
  character_name: string;
  share_id: string;
}
function FeedPage() {
  const { userId } = useParams();
  const ID = userId || "";
  const [searchParams] = useSearchParams();
  const postId = searchParams.get("post_id");
  const [isLoggedInUserFeed, setIsLoggedInUserFeed] = useState(false);
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  const [userExists, setUserExists] = useState(true);
  const [userBuckets, setUserBuckets] = useState<Bucket[]>([]);

  const isLocalStorageSupported = isLocalStorageAvailable();
  const token = isLocalStorageSupported
    ? localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`)
    : null;
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;
  const navigate = useNavigate();
  const referrer = document.referrer;

  useEffect(() => {
    const fetchUsername = async () => {
      if (!authenticatedEmail) return;

      const { data: users, error } = await supabase
        .from("users")
        .select("id")
        .eq("email", authenticatedEmail)
        .single();

      if (error) {
        console.error("Error fetching user data:", error.message);
        return;
      }
      setIsLoggedInUser(true);
      if (users?.id === ID) {
        setIsLoggedInUserFeed(true);
      } else {
        setIsLoggedInUserFeed(false);
      }
    };

    fetchUsername();
  }, [authenticatedEmail, ID]);

  useEffect(() => {
    const fetchUserBuckets = async () => {
      if (!authenticatedEmail) return;

      const { data: userData } = await supabase
        .from("users")
        .select("id")
        .eq("email", authenticatedEmail)
        .single();

      if (userData) {
        const { data, error } = await supabase
          .from("buckets")
          .select("*")
          .eq("by_shakty", false)
          .eq("created_by", userData.id)
          .order("created_at", { ascending: true })
          .eq("is_verified", true);

        if (error) {
          console.error("Error fetching buckets:", error);
          return;
        }
        setUserBuckets(data || []);
      }
    };

    fetchUserBuckets();
  }, [authenticatedEmail]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", ID)
        .single();

      if (error) {
        console.error("Error fetching user data:", error.message);
      }

      if (!users) {
        setUserExists(false);
      }
    };

    fetchUser();
  }, [ID]);

  const onClose = () => {
    if (referrer.includes(`${window.location.origin}/${ID}`)) {
      navigate(`/${ID}`);
    } else {
      navigate("/chat");
    }
  };

  return (
    <main className="min-h-screen w-screen mx-auto flex flex-col bg-white text-ui-90 relative">
      {userExists ? (
        <>
          <div className="flex-grow overflow-y-auto">
            <div className="pb-4 max-w-[48rem] mx-auto">
              <Header />
            </div>
            <div className="px-2 flex-col gap-3 pb-20 w-full max-w-[48rem] mx-auto">
              <FeedHeader
                userId={ID}
                isLoggedInUserFeed={isLoggedInUserFeed}
                isLoggedInUser={isLoggedInUser}
              />
              <div className="flex justify-between my-4 mt-16 max-w-[48rem]">
                <div className="flex flex-col gap-4 px-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userBuckets.map((bucket) => {
                      let imageSrc;
                      if (bucket.shakty_dp) {
                        imageSrc = `${
                          import.meta.env.VITE_SUPABASE_URL
                        }/storage/v1/object/public/img/${bucket.shakty_dp}`;
                      } else {
                        return (
                          <div
                            key={bucket.id}
                            className="bg-[#fafafa7e] px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer min-w-[250px]"
                            onClick={() =>
                              navigate(`/shakty/${bucket.share_id}`)
                            }
                          >
                            <div className="flex items-center gap-1 md:gap-2 justify-start">
                              <div className="w-[30px] h-[30px] bg-[#F87631] rounded-full flex items-center justify-center overflow-hidden">
                                <svg
                                  width="20"
                                  height="50"
                                  viewBox="0 0 61 52"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M46.2693 22.4561H40.4205C39.0066 22.4561 37.9139 23.6413 37.9139 25.024L23.1313 25.0899C23.1313 23.6413 21.9744 22.5219 20.6247 22.5219H14.7759C12.5906 22.5219 10.791 24.3656 10.791 26.6044V40.3662C10.791 42.6049 12.5906 44.4486 14.7759 44.4486H46.2693C48.4546 44.4486 50.2542 42.6049 50.2542 40.3662V26.6044C50.3185 24.2997 48.5189 22.4561 46.2693 22.4561ZM43.5056 31.3453V36.8763C43.5056 37.6006 42.9272 38.1932 42.2202 38.1932C41.5132 38.1932 40.9347 37.6006 40.9347 36.8763V31.3453C40.9347 30.621 41.5132 30.0283 42.2202 30.0283C42.9272 30.0283 43.5056 30.621 43.5056 31.3453ZM33.929 38.5883C32.965 39.576 31.7438 40.0369 30.5226 40.0369C29.3014 40.0369 28.0803 39.576 27.1162 38.5883C26.602 38.0616 26.602 37.2714 27.1162 36.7446C27.6304 36.2179 28.4016 36.2179 28.9158 36.7446C29.8156 37.6006 31.1653 37.6006 32.0651 36.7446C32.5793 36.2179 33.3506 36.2179 33.8648 36.7446C34.379 37.2714 34.4432 38.0616 33.929 38.5883ZM20.1105 31.3453V36.8763C20.1105 37.6006 19.532 38.1932 18.8251 38.1932C18.1181 38.1932 17.5396 37.6006 17.5396 36.8763V31.3453C17.5396 30.621 18.1181 30.0283 18.8251 30.0283C19.532 30.0283 20.1105 30.621 20.1105 31.3453Z"
                                    fill="white"
                                    fill-opacity="0.8"
                                  />
                                  <path
                                    d="M57.3241 27.4616H56.7456V26.5397C56.7456 20.6136 52.0538 15.8727 46.3335 15.8727H31.808V11.8561C34.1861 11.2635 35.9857 9.02469 35.9857 6.39085C35.9857 3.29609 33.5433 0.793945 30.5225 0.793945C27.5017 0.793945 25.0594 3.29609 25.0594 6.39085C25.0594 9.02469 26.859 11.2635 29.2371 11.8561V15.8727H14.7758C8.99132 15.8727 4.36372 20.6794 4.36372 26.5397V27.4616H3.72099C2.04991 27.4616 0.700195 28.8443 0.700195 30.5563V37.536C0.700195 39.248 2.04991 40.6308 3.72099 40.6308H4.36372C4.49226 46.3594 9.11987 51.0344 14.7758 51.0344H46.2692C51.9252 51.0344 56.5528 46.4252 56.6814 40.6308H57.3241C58.9952 40.6308 60.3449 39.248 60.3449 37.536V30.6222C60.3449 28.9102 58.9952 27.4616 57.3241 27.4616ZM57.774 37.6019C57.774 37.8652 57.5812 38.0628 57.3241 38.0628H56.7456V30.1613H57.3241C57.5812 30.1613 57.774 30.3588 57.774 30.6222V37.6019ZM46.2692 48.4664H14.7758C10.4053 48.4664 6.93461 44.8449 6.93461 40.3674V39.3797V28.8443V26.6056C6.93461 22.1939 10.4696 18.5724 14.7758 18.5724H30.5225H46.2692C50.5755 18.5724 54.1105 22.1939 54.1105 26.6056V28.8443V39.3797V40.3674C54.1747 44.8449 50.6398 48.4664 46.2692 48.4664ZM3.27109 37.6019V30.6222C3.27109 30.3588 3.4639 30.1613 3.72099 30.1613H4.36372V38.0628H3.72099C3.4639 38.0628 3.27109 37.8652 3.27109 37.6019ZM30.5225 3.42778C32.1293 3.42778 33.4148 4.7447 33.4148 6.39085C33.4148 8.037 32.1293 9.35392 30.5225 9.35392C28.9157 9.35392 27.6303 8.037 27.6303 6.39085C27.6303 4.7447 28.9157 3.42778 30.5225 3.42778Z"
                                    fill="white"
                                    fill-opacity="0.8"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-sm md:text-lg font-bold mb-1 text-gray-700 text-[12px] md:text-[14px]">
                                  {bucket.name}
                                </h3>
                                <p className="text-gray-600 text-[10px] md:text-[12px] line-clamp-3">
                                  {bucket.bio}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={bucket.id}
                          className="bg-[#fafafa7e] px-4 py-3 rounded-lg shadow-lg hover:shadow-xl transition-shadow cursor-pointer min-w-[250px]"
                          onClick={() => navigate(`/${bucket.share_id}`)}
                        >
                          <div className="flex items-center gap-1 md:gap-2 justify-start">
                            <img
                              src={imageSrc}
                              alt={bucket.name}
                              className="w-[30px] h-[30px] object-contain rounded-full"
                            />
                            <div>
                              <h3 className="text-sm md:text-lg font-bold mb-1 text-gray-700 text-[12px] md:text-[14px]">
                                {bucket.name}
                              </h3>
                              <p className="text-gray-600 text-[10px] md:text-[12px] line-clamp-3">
                                {bucket.bio}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* <Feed userName={userName} isLoggedInUserFeed={isLoggedInUserFeed} /> */}
              {/* <ProfileBuckets /> */}
            </div>
          </div>
          <PostDialog
            key={postId ?? "default"}
            postId={postId ?? ""}
            onClose={onClose}
          />
        </>
      ) : (
        <div className="grid place-items-center h-screen">Page Not Found</div>
      )}
    </main>
  );
}

export default FeedPage;
