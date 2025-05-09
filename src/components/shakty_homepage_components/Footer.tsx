import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className=" w-full flex flex-col items-center bg-[#f5ebf0] py-4 md:py-10">
      <div className="border border-black border-solid max-md:max-w-full" />
      <div className="flex flex-row gap-6 items-center">
        <a href="https://instagram.com/gowandergals" target="_blank">
          <img
            src={"/assets/instagram.svg"}
            alt="instagram image"
            className="md:w-[30px] md:h-[30px] w-[13px] h-[13px]"
          />
        </a>
        <a href="mailto:karthik@instalane.co">
          <img
            src={"/assets/e-mail.svg"}
            alt="mail image"
            className="md:w-[30px] md:h-[25px] h-[10px] w-[13px]"
          />
        </a>
      </div>
      <div className="flex mt-5 lg:mt-0 flex-col-reverse lg:flex-col">
        <p className="self-center mt-1 lg:mt-5 lg:mb-2 text-[8px] leading-[13px] lg:text-[14px] lg:leading-none font-normal text-black font-lexend mb-1">
          2024 | Instalane Internet Pvt Ltd
        </p>
        <div className="flex flex-row gap-2">
          <a
            href="about-us"
            className="text-black font-lexend font-normal text-[10px] leading-[12px] lg:text-[20px]"
          >
            About Us
          </a>
          <span className="text-black font-lexend font-normal text-[10px] leading-[12px] lg:text-[20px]">
            {" "}
            |{" "}
          </span>
          <a
            href="privacy"
            className="text-black font-lexend font-normal text-[10px] leading-[12px] lg:text-[20px]"
          >
            Privacy Policy
          </a>
          <span className="text-black font-lexend font-normal text-[10px] leading-[12px] lg:text-[20px]">
            {" "}
            |{" "}
          </span>
          <a
            href="tos"
            className="text-black font-lexend font-normal text-[10px] leading-[12px] lg:text-[20px]"
          >
            Terms & Services
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
