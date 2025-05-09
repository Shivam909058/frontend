import { useNavigate } from "react-router-dom";

export const VerificationInProcessPage = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-white h-screen w-screen flex flex-col items-center justify-center mx-auto px-6 max-w-[430px]">
      <h1 className="text-big font-lexend text-black">
        Verification In Process
      </h1>
      <div className="text-medium font-lexend text-ui-50 mt-3">
        We will verify you within 24 - 48 hours. You will receive an email once
        verification in complete
      </div>
      <img
        src={"/assets/signupSuccess.gif"}
        alt="signup success"
        width={280}
        height={280}
        className="mt-7"
      />
      <button
        className="mt-24 py-4 px-10 text-white text-body font-normal font-lexend bg-orange border-0 rounded-2xl"
        onClick={() => navigate("/")}
      >
        Thank you
      </button>
    </div>
  );
};
