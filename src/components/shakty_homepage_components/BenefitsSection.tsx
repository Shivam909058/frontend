import React from "react";
import LoginButton from "./LoginButton";

const BenefitsSection: React.FC = () => {
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;
  return (
    <>
      <section className="flex relative flex-col items-center px-6 py-16 mt-2 lg:mt-5 w-full md:rounded-3xl min-h-[280px] md:min-h-[300px] max-md:px-4 max-md:py-12 max-md:max-w-full font-lexend font-bold">
        <picture>
          <source
            srcSet="https://cdn.builder.io/api/v1/image/assets/TEMP/e30fbf5601cefcde92a4bad8b0d6c6f8cbe1626aad1c06cd9d78f7ab670b1c3d?placeholderIfAbsent=true&apiKey=9e0e13693454444cac96580d4357c01c"
            className="object-scale-down absolute inset-0 size-full"
          />
          <img
            loading="lazy"
            src="https://cdn.builder.io/api/v1/image/assets/TEMP/e30fbf5601cefcde92a4bad8b0d6c6f8cbe1626aad1c06cd9d78f7ab670b1c3d?placeholderIfAbsent=true&apiKey=9e0e13693454444cac96580d4357c01c"
            alt="img"
            className="object-fill absolute inset-0 size-full lg:px-0"
          />
        </picture>
        <div className="absolute inset-0 flex flex-col justify-end items-center lg:p-4">
          {/* For larger screens */}
          <div className="hidden absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex-col gap-8 px-8 w-full">
            <div className="flex flex-col md:align-center md:justify-between md:flex-row gap-8 w-full">
              <div className="flex lg:w-[509px] text-center leading-[37.5px] justify-center items-center px-8 pt-10 pb-6 w-full md:w-1/2 text-[18px] md:text-[20px] lg:text-[30px] font-normal text-black rounded-2xl border border-black border-solid bg-[#FAFAFA] shadow-searchShadow">
                Query your saved content and get tailored insights
              </div>
              <div className="flex lg:w-[509px] text-center leading-[37.5px] justify-center items-center px-8 pt-10 pb-6 w-full md:w-1/2 text-[18px] md:text-[20px] lg:text-[30px] font-normal text-black rounded-2xl border border-black border-solid bg-[#FAFAFA] shadow-searchShadow">
                Track to-dos, spending, and ideas seamlessly
              </div>
            </div>
            <div className="flex justify-center items-center px-8 pt-10 pb-6 lg:w-[509px] absolute -bottom-full left-1/2 transform translate-x-[-50%] translate-y-[122%] text-center leading-[37.5px] md:w-1/2 mx-auto text-[18px] md:text-[20px] lg:text-[30px] font-normal text-black rounded-2xl border border-black border-solid bg-[#FAFAFA] shadow-searchShadow">
              Get suggestions based on your unique preferences
            </div>
          </div>
          {/* For mobile screens */}
          <div className="pb-2 px-1 flex flex-row gap-2 w-full justify-between rounded-b-3xl font-lexend font-normal">
            <div className="flex-1 max-w-[112px] md:max-w-[174px] flex justify-center items-center px-2 py-1 md:py-2 md:px-3 text-[10px] md:text-[14] md:leading-[16px] font-normal leading-[12.5px] text-black rounded-lg border border-black border-solid bg-[#FAFAFA] shadow-searchShadow">
              Query your saved content and get tailored insights
            </div>
            <div className="flex-1 max-w-[112px] md:max-w-[174px] flex justify-center items-center px-2 py-1 md:py-2 md:px-3 text-[10px] md:text-[14] md:leading-[16px] font-normal leading-[12.5px] text-black rounded-lg border border-black border-solid bg-[#FAFAFA] shadow-searchShadow">
              Track to-dos, spending, and ideas seamlessly
            </div>
            <div className="flex-1 max-w-[112px] md:max-w-[174px] flex justify-center items-center px-2 py-1 md:py-2 md:px-3 text-[10px] md:text-[14] md:leading-[16px] font-normal leading-[12.5px] text-black rounded-lg border border-black border-solid bg-[#FAFAFA] shadow-searchShadow">
              Get suggestions based on your unique preferences
            </div>
          </div>
        </div>
      </section>
      <div className="flex justify-center items-center p-2 md:p-10 ">
        {!authenticatedEmail && <LoginButton />}
      </div>
      <div className="h-[1px] w-full border-b-[1px] border-black mt-1 md:mt-2"></div>
    </>
  );
};

export default BenefitsSection;
