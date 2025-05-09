import React, { useState } from "react";
import { LoginDrawer } from "../../components/loginDrawer";

const LoginButton: React.FC = () => {
  const [isLoginDrawerOpen, setIsLoginDrawerOpen] = useState(false);

  const handleJoinClick = () => {
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    setIsLoginDrawerOpen(true);
  };

  return (
    <>
      <button
        className="overflow-hidden h-[30px] self-stretch px-[0.25px] py-[0.25px] my-auto text-[12px] font-bold text-white whitespace-nowrap bg-orange rounded-[6px] hover:bg-deep-orange-800 font-lexend leading-[15px] w-[120px]"
        onClick={() => {
          handleJoinClick();
        }}
      >
        Login to Chat
      </button>
      {isLoginDrawerOpen && (
        <LoginDrawer close={() => setIsLoginDrawerOpen(false)} />
      )}
    </>
  );
};

export default LoginButton;
