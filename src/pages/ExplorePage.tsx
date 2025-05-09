import { useEffect, useState } from "react";
import Header from "../components/header/Header";
import { Explore } from "../modules/feed/components/feed/Explore";
import { supabase } from "../lib/supabase";

function ExplorePage() {
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  const [userId, setUserId] = useState(null);

  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;

  useEffect(() => {
    const fetchUserId = async () => {
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

      if (users?.id) {
        setUserId(users.id);
        setIsLoggedInUser(true);
      }
    };

    fetchUserId();
    window.scrollTo(0, 0);
  }, [authenticatedEmail, userId]);
  console.log(isLoggedInUser);
  return (
    <main
      className="min-h-screen w-screen mx-auto flex flex-col bg-white text-ui-90 relative"
      style={{ maxWidth: "430px" }}
    >
      <div className="flex-grow overflow-y-auto">
        <div className="px-3 py-5">
          <Header />
        </div>
        <div className="px-4 pb-20">
          <Explore />
        </div>
      </div>
    </main>
  );
}

export default ExplorePage;
