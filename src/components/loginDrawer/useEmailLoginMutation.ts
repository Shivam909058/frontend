// Import the supabase client
import { useState } from "react";
import { supabase } from "../../lib/supabase";

export const useEmailLoginMutation = (config = {}) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { onSuccess }: { onSuccess?: () => void } = config;

  const mutate = async ({
    emailId,
    action = "login",
  }: {
    emailId: string;
    action?: string;
  }) => {
    setIsPending(true);
    setError(null);

    try {
      if (action === "login") {
        const { error: loginError } = await supabase.auth.signInWithOtp({
          email: emailId.toLowerCase(),
          options: {
            shouldCreateUser: true,
          },
        });

        if (loginError) throw loginError;

        if (onSuccess && typeof onSuccess === "function") {
          onSuccess();
        }
      } else if (action === "resendOtp") {
        const { error } = await supabase.auth.signInWithOtp({
          email: emailId.toLowerCase(),
          options: {
            shouldCreateUser: true,
          },
        });
        if (error) throw error;
      }
    } catch (err: unknown) {
      // Specify that err is of type unknown
      if (err instanceof Error) {
        // Type checking
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsPending(false);
    }
  };

  return { mutate, error, isPending };
};
