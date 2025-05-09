import { ReactElement } from "react";
import { useNavigate } from "react-router-dom";
// import LoginButton from "../shakty_homepage_components/LoginButton";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface props {
  openDrawer: () => void;
  isOpen: boolean;
}

export const MainHeader = ({ openDrawer, isOpen }: props): ReactElement => {
  const navigate = useNavigate();
  const token = localStorage.getItem(`${import.meta.env.VITE_TOKEN_ID}`);
  const parsedToken = token ? JSON.parse(token) : null;
  const authenticatedEmail = parsedToken?.user?.email;

  return (
    <div className="header">
      <div
        className="flex flex-row gap-2 items-center justify-center cursor-pointer"
        onClick={() => {
          if (authenticatedEmail) {
            navigate("/chat");
            window.location.reload();
          } else {
            navigate("/");
          }
        }}
      >
        <img src={"/assets/logo3.svg"} alt="ShaktyAI" className="w-[120px]" />
      </div>
      <div className="flex flex-row  md:w-auto">
        {/* {!authenticatedEmail && <LoginButton />} */}
        {isOpen ? (
          <div className="ml-3 flex h-7 items-center">
            <button type="button" className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none" onClick={() => openDrawer()}>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        ) : (
          <button className=" bg-white w-10 h-10 flex items-center justify-center overflow-hidden" onClick={() => openDrawer()}>
            <svg width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 8.94214C20 9.20565 19.9122 9.45837 19.7559 9.6447C19.5996 9.83103 19.3877 9.93571 19.1667 9.93571H0.833333C0.61232 9.93571 0.400358 9.83103 0.244078 9.6447C0.0877975 9.45837 0 9.20565 0 8.94214C0 8.67863 0.0877975 8.42591 0.244078 8.23958C0.400358 8.05325 0.61232 7.94857 0.833333 7.94857H19.1667C19.3877 7.94857 19.5996 8.05325 19.7559 8.23958C19.9122 8.42591 20 8.67863 20 8.94214ZM0.833333 1.98714H19.1667C19.3877 1.98714 19.5996 1.88246 19.7559 1.69613C19.9122 1.5098 20 1.25708 20 0.993571C20 0.730059 19.9122 0.477341 19.7559 0.29101C19.5996 0.10468 19.3877 0 19.1667 0H0.833333C0.61232 0 0.400358 0.10468 0.244078 0.29101C0.0877975 0.477341 0 0.730059 0 0.993571C0 1.25708 0.0877975 1.5098 0.244078 1.69613C0.400358 1.88246 0.61232 1.98714 0.833333 1.98714ZM19.1667 15.8971H0.833333C0.61232 15.8971 0.400358 16.0018 0.244078 16.1881C0.0877975 16.3745 0 16.6272 0 16.8907C0 17.1542 0.0877975 17.4069 0.244078 17.5933C0.400358 17.7796 0.61232 17.8843 0.833333 17.8843H19.1667C19.3877 17.8843 19.5996 17.7796 19.7559 17.5933C19.9122 17.4069 20 17.1542 20 16.8907C20 16.6272 19.9122 16.3745 19.7559 16.1881C19.5996 16.0018 19.3877 15.8971 19.1667 15.8971Z"
                fill="#1A212B"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
