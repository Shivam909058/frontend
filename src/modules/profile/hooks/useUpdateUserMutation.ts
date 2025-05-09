import { supabase } from "../../../lib/supabase";
import type { User } from "../../profile/types";
import { useNavigate } from "react-router-dom";

export const useUpdateUserMutation = () => {
  const navigate = useNavigate();
  const updateUser = async (payload: User) => {
    const userSession = localStorage.getItem(
      `${import.meta.env.VITE_TOKEN_ID}`
    );
    if (!userSession) {
      console.error("Access token or email is not available.");
      return;
    }

    const {
      access_token,
      user: { email: userEmail } = {} as { email: string },
    } = JSON.parse(userSession);

    if (!access_token || !userEmail) {
      console.error(
        "Failed to retrieve user email and access token from session."
      );
      return;
    }


    const { data, error } = await supabase
      .from("users")
      .update({
        name: payload.name,
        username: payload.username?.toLowerCase(),
        bio: payload.bio,
        location: payload.location,
      
      })
      .match({ email: userEmail });

    if (error) {
      throw error;
    }
    const redirectUrl = localStorage.getItem('redirectAfterLogin');
    if (redirectUrl) {
      localStorage.removeItem('redirectAfterLogin');
      navigate(redirectUrl);
      window.location.reload();
      return;
    }
    navigate("/chat");

    return data;
  };

  return { mutate: updateUser };
};
