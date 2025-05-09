import { useEffect, useState } from "react";
import { ProfileUpdateForm } from "../modules/profile/components/profileUpdateForm";
import { supabase } from "../lib/supabase";
import { User } from "../modules/profile/types";
import { Spinner } from "@material-tailwind/react";

const emptyUser = {
  id: "",
  name: "",
  username: "",
  bio: "",
  location: "",
  social_media_links: "",
};

function ProfileCreationPage() {
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;
  const [user, setUser] = useState<User>(emptyUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!authenticatedEmail) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, name, location, bio, username")
        .eq("email", authenticatedEmail)
        .single();

      if (error) {
        console.error("Error fetching user data:", error.message);
        setLoading(false);
        return;
      }
      if (data.name === null) {
        setLoading(false);
        return;
      }
      setUser({
        id: data.id,
        name: data.name,
        bio: data.bio,
        location: data.location,
        username: data.username,
      });
      setLoading(false);
    };

    fetchProfile();
  }, [authenticatedEmail]);

  if (loading) {
    return (
      <div className="grid place-items-center h-screen">
        <Spinner
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
      </div>
    );
  }

  return <ProfileUpdateForm user={user} />;
}

export default ProfileCreationPage;
