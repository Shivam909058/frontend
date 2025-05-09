import { useEffect, useState } from "react";
import { IconButton, Spinner } from "@material-tailwind/react";
import { ImageInput } from "./ImageInput";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import Header from "../header/Header";
import Footer from "../Footer";

function SignUpForm() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [frontImageID, setFrontImageID] = useState("");
  const [backImageID, setBackImageID] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [frontImageSignedUrl, setFrontImageSignedUrl] = useState("");
  const [backImageSignedUrl, setBackImageSignedUrl] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleUploadSuccess = (payload: {
    id: string;
    value: string;
    signedUrl: string;
  }) => {
    if (payload.id === "frontImage") {
      setFrontImageID(payload.value);
      setFrontImageSignedUrl(payload.signedUrl);
    } else if (payload.id === "backImage") {
      setBackImageID(payload.value);
      setBackImageSignedUrl(payload.signedUrl);
    }
  };

  // Email validation function
  const isValidEmail = (email: string) => {
    const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate email format
    if (!isValidEmail(email)) {
      setError("Invalid email format");
      return;
    }

    setIsSubmitting(true);

    const { error: userError } = await supabase.from("users").insert([
      {
        name: fullName,
        email: email.toLowerCase(),
        id_front: frontImageID,
        id_back: backImageID,
      },
    ]);

    if (userError) {
      setIsSubmitting(false);
      if (userError.code === "23505") {
        setError("Email already exists");
      } else {
        setError(userError.message);
      }
      return;
    }

    const { error: waitlistError } = await supabase.from("waitlist").insert([
      {
        name: fullName,
        email: email.toLowerCase(),
      },
    ]);

    if (waitlistError) {
      setIsSubmitting(false);
      setError(waitlistError.message);
      return;
    } else {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sendThankYouEmail`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              name: fullName,
              email: email.toLowerCase(),
              frontImageSignedUrl: frontImageSignedUrl,
              backImageSignedUrl: backImageSignedUrl,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to send thank you email");
        }

        navigate("/verification-in-process");
      } catch (error) {
        console.error("Error sending thank you email:", error);
        setError("please make sure this email address exits");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const isSubmitEnabled =
    !!fullName && !!email && !!frontImageID && !!backImageID;
  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <header className="fixed top-2 px-2 w-full py-2" style={{ zIndex: 1001 }}>
        <Header />
      </header>
      <form
        onSubmit={handleSubmit}
        className="px-7 pt-11 bg-white h-auto max-w-[430px] mx-auto flex flex-col justify-center mt-14"
      >
        <div className="flex flex-row gap-3 items-center">
          <IconButton
            variant="outlined"
            placeholder="back button"
            className="rounded-full"
            size="sm"
            onClick={() => navigate(-1)}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          >
            <img
              src={"/assets/chevronLeft.svg"}
              alt="back icon"
              width={20}
              height={20}
            />
          </IconButton>
          <h1 className="text-ui-90 font-lexend font-semibold text-big">
            SignUp
          </h1>
        </div>
        <div className="flex flex-col gap-7 mt-12">
          <section className="flex flex-col gap-2">
            <h1 className="text-ui-90 font-lexend font-medium text-medium">
              Tell us your full name
            </h1>
            <input
              placeholder="Enter your full name"
              type="text"
              className="border-0.8 rounded-xl p-3 text-ui-90 font-lexend font-normal text-medium border-ui-10"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </section>
          <section className="flex flex-col gap-2">
            <h1 className="text-ui-90 font-lexend font-medium text-medium">
              Your email?
            </h1>
            <input
              placeholder="Enter your email id"
              type="text"
              className={`border-0.8 rounded-xl p-3 text-ui-90 font-lexend font-normal text-medium ${
                error ? "border-negative-30" : "border-ui-10"
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoCapitalize="none"
            />
            {error && (
              <div className="flex flex-row gap-1">
                <img
                  src={"/assets/error.svg"}
                  alt="error img"
                  width={12}
                  height={12}
                />
                <span className="text-h5-m text-negative-60 font-lexend font-normal">
                  {error}
                </span>
              </div>
            )}
          </section>
          <section className="flex flex-col gap-3">
            <p className="text-ui-90 font-lexend font-light text-small">
              This is an exclusive network of women only.
            </p>
            <p className="text-ui-90 font-lexend font-light text-small">
              To ensure safety within the community, we make sure to verify
              everyone before joining. Your ID will be deleted immediately after
              verification.
            </p>
            <p className="text-ui-90 font-lexend font-light text-small">
              Please submit a clear photo of your ID.
            </p>
          </section>
          {/* <section className="border-0.8 rounded-xl p-3 border-ui-10 flex flex-row gap-3 items-center">
            <img
              src={"/assets/id.svg"}
              alt="image"
              width={50}
              height={50}
              className="w-6 h-4"
            />
            <span className="text-ui-90 font-lexend font-normal text-small">
              Upload Aadhar/Driving license/passport
            </span>
          </section> */}
          <section className="flex flex-col">
            {/* <h1 className="text-ui-90 font-lexend font-medium text-medium">
              Submit Photo
            </h1> */}
            <div className="flex flex-row gap-3">
              <ImageInput
                label="ID - FRONT"
                id="frontImage"
                onUploadSuccess={(payload) => handleUploadSuccess(payload)}
              />
              <ImageInput
                label="ID - BACK"
                id="backImage"
                onUploadSuccess={(payload) => handleUploadSuccess(payload)}
              />
            </div>
            <p className="text-ui-90 font-lexend font-light text-small mt-3">
              Acceptable ID proof : Aadhar, Driving Licence, Passport{" "}
              <span className=" text-ui-40">
                (Files accepted : jpg,jpeg,png; Max file size : 2mb)
              </span>
            </p>
          </section>
        </div>
        <div className="flex justify-center mt-14">
          <button
            disabled={!isSubmitEnabled}
            type="submit"
            className={
              isSubmitEnabled
                ? "py-4 px-10 text-white text-body font-normal font-lexend bg-orange border-0 rounded-2xl"
                : "py-4 px-10 text-ui-90 text-body font-normal font-lexend bg-ui-10 border-0 rounded-2xl"
            }
          >
            {isSubmitting ? (
              <Spinner
                onPointerEnterCapture={() => {}}
                onPointerLeaveCapture={() => {}}
              />
            ) : (
              "Submit Details"
            )}
          </button>
        </div>
        <div className="w-full bg-ui-20 h-[1px] mt-14"></div>
        <Footer />
      </form>
    </div>
  );
}

export { SignUpForm };
