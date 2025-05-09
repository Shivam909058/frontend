import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

function BottomNav() {
  const navigate = useNavigate();
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;
  const [userDetails, setUserDetails] = useState<{
    id: string;
    name: string;
    profile_picture_url: string;
  } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authenticatedEmail) return;

      const { data, error } = await supabase.from("users").select("name, profile_picture_url, id").eq("email", authenticatedEmail).single();

      if (error) {
        console.error("Error fetching user data:", error.message);
        return;
      }

      setUserDetails(data);
    };

    fetchProfile();
  }, [authenticatedEmail]);

  const goToProfile = () => {
    if (userDetails?.id) {
      navigate(`/${userDetails?.id}`);
    } else {
      navigate("/");
    }
  };
  return (
    <div className="absolute bottom-3 left-4 z-10 w-11/12 lg:hidden">
      <button className="flex flex-row items-center gap-2 bg-[#F3F3F3] p-2 w-full rounded-md" onClick={() => goToProfile()}>
        {userDetails?.profile_picture_url ? (
          <img
            src={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/img/${userDetails.profile_picture_url}`}
            alt="user image"
            className="w-11 h-11 object-cover rounded-full"
          />
        ) : (
          <img src={"/assets/user-icon.svg"} alt="logo image" className="w-11 h-11" />
        )}
        <div>{userDetails?.name}</div>
      </button>
    </div>
  );
}

export default BottomNav;
