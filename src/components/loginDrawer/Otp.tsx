import { useCallback, useEffect, useState } from "react";
import OTPInput from "react-otp-input";
import { useCountDown } from "../../hooks/useCountDown";
import { supabase } from "../../lib/supabase"; // Ensure you import supabase
import { verifyOtpWithRetry } from "../../utils/auth"; // Import the new utility
import { useEmailLoginMutation } from "./useEmailLoginMutation";
import { useNavigate } from "react-router-dom";

type OtpProps = {
  close: () => void;
  onBack: () => void;
  emailId: string;
};

function Otp({ close, onBack, emailId }: OtpProps) {
  const [otp, setOtp] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Assuming useEmailLoginMutation might be used for resendOtp logic
  const { mutate: resendOtp } = useEmailLoginMutation();

  const [remainingTime, { startCountdown, resetCountdown }] = useCountDown({
    startValue: 2 * 60,
    countdownInterval: 1000,
  });

  useEffect(() => {
    startCountdown();
  }, [startCountdown]);

  const handleResendOtp = useCallback(async () => {
    await resendOtp({ emailId, action: "resendOtp" });
    resetCountdown();
    startCountdown();
  }, [emailId, resendOtp, resetCountdown, startCountdown]);

  const handleOTPSubmit = useCallback(async () => {
    setIsPending(true);
    setError("");

    try {
      // Use the retry utility instead of direct verification
      const { data, error: otpError } = await verifyOtpWithRetry(emailId, otp);

      if (otpError) throw otpError;

      // Check if we have session data
      if (!data) {
        throw new Error("No session data received");
      }

      // Type assertion to handle the type error
      let session = null;
      let user = null;

      // Safely extract user and session with type guards
      if (data && typeof data === 'object') {
        if ('session' in data) {
          // It's from auth response
          session = data.session;
        }

        if ('user' in data) {
          // It's from verifyOtp
          user = data.user;
        } else if (session && 'user' in session) {
          // Try to get user from session
          user = session.user;
        }
      }

      // Store session in localStorage if it exists
      if (session) {
        localStorage.setItem(import.meta.env.VITE_TOKEN_ID, JSON.stringify(session));
      } else {
        throw new Error("No session data available");
      }

      // Check if we have user data
      if (!user) {
        throw new Error("User data not found");
      }

      const NEW_USER_THRESHOLD = 180000;
      const createdAt = new Date(user.created_at || 0).getTime();
      const lastSignInAt = new Date(user.last_sign_in_at || 0).getTime();
      const isNewUser = Math.abs(createdAt - lastSignInAt) < NEW_USER_THRESHOLD;

      if (isNewUser) {
        // Call the sendWelcomeEmail function
        try {
          const { error: welcomeEmailError } = await supabase.functions.invoke(
            "sendWelcomeEmail",
            {
              body: { email: user.email },
            }
          );

          if (welcomeEmailError) console.error("Welcome email error:", welcomeEmailError);
        } catch (error) {
          console.error("Error sending welcome email:", error);
        }

        navigate("/profile");
      } else {
        const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
        if (redirectAfterLogin) {
          navigate(redirectAfterLogin);
          localStorage.removeItem('redirectAfterLogin');
          window.location.reload();
        } else {
          navigate("/chat");
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        // Use the original error handling
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsPending(false);
    }
  }, [emailId, otp, navigate]);

  const isResendActive = remainingTime === 0;
  const formattedTime = new Date(remainingTime * 1000)
    .toISOString()
    .slice(14, 19);

  return (
    <>
      <div className="flex flex-row justify-between items-center">
        <button
          onClick={onBack}
          className="border-0.8 rounded-full border-ui-90 w-8 h-8 flex items-center justify-center"
        >
          <img
            src={"/assets/left.svg"}
            alt="side arrow image"
            width={8}
            height={8}
          />
        </button>
        <button
          onClick={close}
          className="border-0.8 rounded-full border-ui-90 p-2"
        >
          <img
            src={"/assets/cancel.svg"}
            alt="close image"
            width={12}
            height={12}
          />
        </button>
      </div>
      <div className="flex flex-col mt-8">
        <h2 className="text-medium text-black font-lexend font-medium">
          Enter the 6-digit OTP
        </h2>
        <p className="text-small text-black font-lexend font-light">
          A verification code has been sent to your email.
        </p>
      </div>
      <div className="mt-4 flex flex-col w-full items-start">
        <OTPInput
          value={otp}
          onChange={setOtp}
          inputType="number"
          skipDefaultStyles={true}
          inputStyle="w-1/6 h-12 rounded-xl p-3 text-ui-90 text-big font-lexend text-center font-bold border-[1.5px] border-ui-10"
          renderInput={(props) => <input {...props} />}
          renderSeparator={<span className="m-1" />}
          numInputs={6}
          shouldAutoFocus
        />
        {error && (
          <div className="flex flex-row gap-1 mt-2">
            <img
              src={"/assets/error.svg"}
              alt="error img"
              width={12}
              height={12}
            />
            <span className="text-h6-m text-negative-60 font-lexend font-normal">
              Incorrect OTP.
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-row items-center justify-between mt-7 bg-positive-5 py-5 px-5 border-0 rounded-2xl">
        <div className="flex flex-col">
          <h2 className="text-medium text-black font-lexend font-normal">
            OTP sent to email
          </h2>
          <p className="text-small text-black font-lexend font-light">
            You should get an otp within 2 mins.
          </p>
        </div>
        <button
          className={`flex border-0 rounded-md ${
            isResendActive ? "bg-positive-60" : "bg-white"
          } w-14 h-6 justify-center items-center`}
          onClick={handleResendOtp}
        >
          <span
            className={`font-lexend font-light ${
              isResendActive ? "text-white" : "text-black"
            }  text-small`}
          >
            {isResendActive ? "Resend" : formattedTime}
          </span>
        </button>
      </div>
      <div className={`flex justify-center mt-10`}>
        <button
          disabled={otp.length !== 6 || isPending}
          onClick={handleOTPSubmit}
          className={`flex flex-row items-center justify-center py-4 px-10 text-body font-normal font-lexend border-0 rounded-2xl ${
            otp.length === 6 ? "text-white bg-orange" : "text-ui-90 bg-ui-10"
          }`}
        >
          {isPending ? "Verifying..." : "Login"}
        </button>
      </div>
      {error && <div className="text-red-500 mt-2">{error}</div>}
    </>
  );
}

export { Otp };
