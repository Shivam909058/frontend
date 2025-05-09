// hooks/useCheckUserNameMutation.js
import { useMutation } from "@tanstack/react-query";
import { supabase } from "../../../lib/supabase";

const checkUserName = async (username: string) => {
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;

  const { data } = await supabase
    .from("users") // Assuming 'users' is your table name
    .select("username, email")
    .eq("username", username)
    .single();


  if (data && data.username && data.email !== authenticatedEmail) throw new Error("username already taken"); // Check if data is not null or undefined
  return data;
};

export const useCheckUserNameMutation = () =>
  useMutation({
    mutationFn: checkUserName,
    mutationKey: ["check-username"],
  });
