import React, { useState } from "react";

interface LinkInputProps {
  initialLink?: string;
  onSelectLink: (link: string, linkText: string) => void;
  setShowLinkInput: (show: boolean) => void;
  onClose: () => void;
}

const LinkInput: React.FC<LinkInputProps> = ({
  initialLink = "",
  onSelectLink,
  setShowLinkInput,
  onClose,
}) => {
  const [linkValue, setLinkValue] = useState(initialLink);
  const [linkTextValue, setLinkTextValue] = useState("");

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLinkValue(e.target.value);
  };

  const handleLinkTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLinkTextValue(e.target.value);
  };

  const handleSubmit = () => {
    if (linkValue && linkTextValue) {
      onSelectLink(linkValue, linkTextValue);
      setShowLinkInput(false);
    }
  };

  const isSubmitDisabled = !linkValue || !linkTextValue;

  return (
    <div className="absolute inset-0 bg-white flex flex-col p-4 pt-10">
      <div className="flex justify-start">
        <button onClick={onClose}>
          <img
            src={"/assets/new_close_icon.svg"}
            alt="close icon"
            width={25}
            height={25}
          />
        </button>
        <h1 className="ml-24 font-lexend text-h5 font-semibold">Add Link</h1>
      </div>
      <input
        type="text"
        value={linkValue}
        onChange={handleLinkChange}
        placeholder="Type or paste the link here"
        className="p-3 mt-4 text-ui-90 font-lexend font-normal text-medium border-1 border-ui-10 rounded-2xl bg-white outline-none"
      />
      <input
        type="text"
        value={linkTextValue}
        onChange={handleLinkTextChange}
        placeholder="Link text"
        className="p-3 mt-4 text-ui-90 font-lexend font-normal text-medium border-1 border-ui-10 rounded-2xl bg-white outline-none"
      />
      <p className="text-ui-90 font-normal font-lexend text-small mt-2">
        Customize how you want your link to appear.
      </p>
      <button
        disabled={isSubmitDisabled}
        onClick={handleSubmit}
        className={`py-4 px-10 mt-8 self-center rounded-2xl font-lexend text-body font-normal border-0 ${
          isSubmitDisabled ? "text-ui-90 bg-ui-10" : "text-white bg-orange"
        }`}
      >
        Done
      </button>
    </div>
  );
};

export default LinkInput;
