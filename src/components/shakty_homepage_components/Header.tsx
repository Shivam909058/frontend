import React from "react";
import LoginButton from "../shakty_homepage_components/LoginButton";

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;
  return (
    <header className="flex flex-wrap gap-5 px-16 w-full h-[180px] bg-[#FAFAFA]">
      <div className="flex items-center flex-grow">
        <img
          loading="lazy"
          src={"/assets/logo.png"}
          alt={`${title} logo`}
          className="object-contain w-[100px] h-[100px] border-[0.5px] border-black mr-6 rounded-full"
        />
        <h1 className="text-[70px] font-bold text-black font-playfair">
          {title}
        </h1>
      </div>
      {!authenticatedEmail ? <LoginButton /> : null}
    </header>
  );
};

export default Header;
