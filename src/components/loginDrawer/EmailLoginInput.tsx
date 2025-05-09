// import JoinButton from "../button/JoinButton";
import { Spinner } from "@material-tailwind/react";

// hooks
import { useInputField } from "../../hooks/useInputField";
import { useEmailLoginMutation } from "./useEmailLoginMutation";

// types
import { useRef, type ReactElement, useCallback, useState } from "react";
// import { useNavigate } from "react-router-dom";

type loginProps = {
  close: () => void;
  onNext: ({ emailId }: { emailId: string }) => void;
};

function EmailLoginInput({ close, onNext }: loginProps): ReactElement {
  const { value: emailId, onChangeValue: onChangeEmailInput } = useInputField();
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailIdRef = useRef(emailId);
  emailIdRef.current = emailId;
  // const navigate = useNavigate();

  const validateEmail = (email: string) => {
    const regex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return regex.test(email);
  };

  const onSuccess = useCallback(() => {
    onNext({ emailId: emailIdRef.current });
  }, [onNext]);

  const { mutate, error, isPending } = useEmailLoginMutation({ onSuccess });

  const handleClick = useCallback(() => {
    if (!validateEmail(emailIdRef.current)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError(null); // Reset the email error state if the email is valid
    mutate({ emailId: emailIdRef.current });
  }, [mutate, emailIdRef.current]);

  return (
    <>
      <div className="flex flex-row justify-between items-center">
        <span className="text-ui-90 font-semibold font-lexend text-big">
          Login
        </span>
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
      <div className="mt-14 flex flex-col gap-2">
        <label
          htmlFor="email"
          className="text-medium font-lexend font-medium text-ui-90"
        >
          Enter email id
        </label>
        <input
          id="email"
          name="email"
          type="email"
          onChange={onChangeEmailInput}
          placeholder="Enter your email to login"
          className={`rounded-xl p-3 text-ui-90 text-small font-lexend font-light ${
            error || emailError
              ? "border-0.8 border-negative-30"
              : "border-0.8 border-ui-10"
          }`}
          autoCapitalize="none"
        />
        {!error && (
          <p className="text-[10px] leading-5 text-stone-950">
            <span className="leading-3">By signing in you agree to our </span>
            <a href="tos" className="underline capitalize">
              terms of services
            </a>
            <span className="leading-3"> and </span>
            <a href="privacy" className="underline capitalize">
              Privacy Policy
            </a>
          </p>
        )}
        {(error || emailError) && (
          <div className="flex flex-row gap-1">
            <img
              src={"/assets/error.svg"}
              alt="error img"
              width={12}
              height={12}
            />
            <span className="text-h6-m text-negative-60 font-lexend font-normal">
              {error ? error : emailError}
            </span>
          </div>
        )}
      </div>
      {error && (
        <div className="flex flex-col mt-6 bg-[#FFE5E7] py-4 items-center border-0 rounded-2xl">
          <h2 className="text-medium text-black font-lexend font-normal">
            Something’s wrong here!
          </h2>
          <p className="text-black font-lexend font-light w-[80%] text-center mt-1 text-[10px]">
            Please check your email id for spelling errors. If you haven’t
            registered with us, join us now!
          </p>
        </div>
      )}
      <div className={`flex justify-center ${error ? "mt-10" : "mt-10"}`}>
        {error ? (
          <div className="flex flex-col items-center justify-between h-40">
            <button
              disabled={emailId ? false : true}
              onClick={isPending ? undefined : handleClick}
              className={`flex flex-row items-center justify-center py-4 px-10 text-body font-normal font-lexend border-0 rounded-2xl w-[117.56px] ${
                emailId ? " text-white bg-orange " : "text-ui-90 bg-ui-10"
              }`}
            >
              {isPending ? (
                <Spinner
                  onPointerEnterCapture={() => {}}
                  onPointerLeaveCapture={() => {}}
                />
              ) : (
                "Next"
              )}
            </button>
            {/* <p className="font-lexend text-[12px] text-gray-600">or</p> */}
            {/* <JoinButton
              className="border-[2px] rounded-full text-purple border-purple bg-white"
              onClick={() => navigate("/signup")}
              blueIcon={true}
              textColor="purple"
            /> */}
          </div>
        ) : (
          <button
            disabled={emailId ? false : true}
            onClick={isPending ? undefined : handleClick}
            className={`flex flex-row items-center justify-center py-4 px-10 text-body font-normal font-lexend border-0 rounded-2xl ${
              emailId ? " text-white bg-orange " : "text-ui-90 bg-ui-10"
            }`}
          >
            {isPending ? (
              <Spinner
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              />
            ) : (
              "Next"
            )}
          </button>
        )}
      </div>
    </>
  );
}

export { EmailLoginInput };
