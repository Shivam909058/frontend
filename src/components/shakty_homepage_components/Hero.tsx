import { useNavigate } from "react-router-dom";
import { LoginDrawer } from "../../components/loginDrawer";
import { useState } from "react";

const Hero = () => {
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const isAuthenticated = parsedToken?.user?.email;

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate("/chat");
    } else {
      setIsLoginDrawerOpen(true);
    }
  };

  return (
    <section className="flex flex-col mt-8 lg:mt-20 w-full items-center text-center">
      <h2 className="xs:text-[24px] xs:leading-[33px] text-[30px] leading-[37.5px] md:text-[60px] lg:text-[60px] md:leading-[72px] lg:leading-[72px]">
        <span className="font-semibold text-[#444444] font-lexend">
          Your Everyday Guide,{" "}
        </span>
      </h2>
      <h2 className="font-lexend xs:text-[24px] xs:leading-[33px] text-[30px] leading-[37.5px] text-[#444444] md:text-[48px] lg:text-[60px] md:text-black md:leading-[72px] lg:leading-[70px]">
        <span className="font-semibold">Powered by </span>
        <span className="font-extrabold lg:text-[63px]">AI</span>
      </h2>
      <h3 className="mt-4 lg:mt-6 mb-4 md:mb-8 xs:text-[12px] text-[16px] leading-[20px] md:text-[32px] lg:text-[32px] font-normal text-black font-lexend md:leading-[36px] lg:leading-[36px]">
        Harness the power of AI to navigate daily life
      </h3>
      <div
        className="flex items-center justify-between lg:mt-4 font-normal text-black bg-[#F0F0F0] shadow-searchShadow rounded-[1000px] w-full max-w-[80%] md:max-w-[95%] xs:max-w-[96%] cursor-pointer"
        onClick={handleGetStarted}
      >
        <p className="font-lexend font-light p-3 md:p-0 lg:p-0 lg:py-1 w-full text-[15px] leading-[19px] md:leading-[62px] md:text-[24px] lg:text-[24px]">
          Get Started with ShaktyAI
        </p>
        <img
          loading="lazy"
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/019b0ea16cf1b17d23e61587ca4719749a984923916c29ecca6981def78e749f?placeholderIfAbsent=true&apiKey=9e0e13693454444cac96580d4357c01c"
          alt="send"
          className="object-contain w-[37px] h-[37px] lg:w-[40px] lg:h-[40px] mr-3 md:mr-12"
        />
      </div>
      {isLoginDrawerOpen && (
        <LoginDrawer close={() => setIsLoginDrawerOpen(false)} />
      )}
    </section>
  );
};

export default Hero;
