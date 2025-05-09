import React from "react";

interface ChatShareButtonProps {
  onClick: () => void;
}

export const ChatShareButton: React.FC<ChatShareButtonProps> = ({
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="text-black font-bold rounded-full px-2 py-2 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition duration-300 ease-in-out transform hover:scale-105"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="11"
        height="11"
        viewBox="0 0 11 11"
        fill="none"
      >
        <path
          d="M0 5.5C0 6.51078 0.822556 7.33333 1.83333 7.33333C2.31856 7.33333 2.75733 7.14083 3.0855 6.83222L6.74667 8.92467C6.73567 9.00411 6.72222 9.08356 6.72222 9.16667C6.72222 10.1774 7.54478 11 8.55556 11C9.56633 11 10.3889 10.1774 10.3889 9.16667C10.3889 8.15589 9.56633 7.33333 8.55556 7.33333C8.07033 7.33333 7.63156 7.52583 7.30339 7.83444L3.64222 5.74261C3.65322 5.66256 3.66667 5.58311 3.66667 5.5C3.66667 5.41689 3.65322 5.33744 3.64222 5.25739L7.30339 3.16556C7.63156 3.47417 8.07033 3.66667 8.55556 3.66667C9.56633 3.66667 10.3889 2.84411 10.3889 1.83333C10.3889 0.822556 9.56633 0 8.55556 0C7.54478 0 6.72222 0.822556 6.72222 1.83333C6.72222 1.91644 6.73567 1.99589 6.74667 2.07594L3.0855 4.16778C2.74756 3.84675 2.29945 3.66742 1.83333 3.66667C0.822556 3.66667 0 4.48922 0 5.5Z"
          fill="black"
        />
      </svg>
    </button>
  );
};
