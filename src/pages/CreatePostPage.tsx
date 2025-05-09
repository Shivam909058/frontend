import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase"; // Make sure to import Supabase client
import LocationInput from "../modules/feed/components/LocationInput";
import LocationSVG from "../assets/location_icon";
import LinkInput from "../modules/feed/components/LinkInput";
import LinkSVG from "../assets/link_icon";

function CreatePostPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { filename, fileType, userName } = location.state || {};
  const [showInput, setShowInput] = useState(false);
  const [typedText, setTypedText] = useState("");
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [locationInputValue, setLocationInputValue] = useState("");
  const [linkInputValue, setLinkInputValue] = useState("");
  const [linkTextValue, setLinkTextValue] = useState("");
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const textInputContainerRef = useRef<HTMLDivElement | null>(null);

  const truncateUrl = (url: string, maxLength = 20) => {
    if (url.length > maxLength) {
      return url.substring(0, maxLength) + "...";
    }
    return url;
  };

  const handleTextIconClick = () => {
    setShowInput(true);
  };

  const handleTextareaInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  const handleTextareaBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    const target = event.target as HTMLTextAreaElement;
    setTypedText(target.value);
    setShowInput(false);
  };

  useEffect(() => {
    if (showInput && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [showInput]);

  const handleLocationIconClick = () => {
    setShowLocationInput(true);
  };

  const handleSelectLocation = (description: string, placeId: string) => {
    setLocationInputValue(description);
    setSelectedPlaceId(placeId);
    setShowLocationInput(false);
  };

  const handleCloseLocationInput = () => {
    setShowLocationInput(false);
    setLocationInputValue("");
  };

  const handleLinkIconClick = () => {
    setShowLinkInput(true);
  };

  const handleSelectLink = (link: string, linkText: string) => {
    setLinkInputValue(link);
    setLinkTextValue(linkText);
    setShowLinkInput(false);
  };

  const handleCloseLinkInput = () => {
    setShowLinkInput(false);
    setLinkInputValue("");
    setLinkTextValue("");
  };

  const handleSubmit = async () => {
    if (!typedText.trim()) {
      return;
    }
    const isVideo = fileType === "video";
    const { data, error } = await supabase.from("posts").insert({
      caption: typedText.trim(),
      location_url: locationInputValue,
      image_url: isVideo ? null : filename,
      video_url: isVideo ? filename : null,
      created_by: userName,
      web_url: linkInputValue,
      web_url_text: linkTextValue,
      place_id: selectedPlaceId,
    });

    if (error) {
      console.error("Error inserting data:", error.message);
    } else {
      console.log("Data inserted successfully:", data);
      navigate("/chat");
    }
  };

  const isSubmitDisabled = !typedText.trim();
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        textInputContainerRef.current &&
        !textInputContainerRef.current.contains(event.target as Node)
      ) {
        setShowInput(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [textInputContainerRef]);

  return (
    <div>
      {filename ? (
        <div className="flex justify-center items-center h-screen bg-black relative">
          {fileType === "video" ? (
            <video
              src={`https://wandergals.s3.ap-south-1.amazonaws.com/${filename}`}
              className="w-full object-cover rounded-2xl h-[80vh] relative"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={`https://wandergals.s3.ap-south-1.amazonaws.com/${filename}`}
              className="w-full object-cover rounded-2xl h-[80vh] relative"
              alt="uploaded media"
            />
          )}
          <img
            src="/assets/new_back_icon.svg"
            alt="back icon"
            className="absolute top-28 left-4 w-8 h-8 cursor-pointer"
            onClick={() => navigate(-1)}
          />
          <img
            src={`/assets/${
              linkInputValue ? "green_link_icon.svg" : "new_link_icon.svg"
            }`}
            alt="link icon"
            className="absolute top-28 right-4 w-8 h-8 cursor-pointer"
            onClick={handleLinkIconClick}
          />
          <img
            src={`/assets/${
              locationInputValue
                ? "green_location_icon.svg"
                : "new_location_icon.svg"
            }`}
            alt="location icon"
            className="absolute top-28 right-14 w-8 h-8 cursor-pointer"
            onClick={handleLocationIconClick}
          />
          <img
            src={`/assets/${
              showInput ? "white_text_icon.svg" : "new_text_icon.svg"
            }`}
            alt="text icon"
            className="absolute top-28 right-[100px] w-8 h-8 cursor-pointer"
            onClick={handleTextIconClick}
          />
          {showInput && (
            <div
              className="absolute inset-0 flex justify-center items-center"
              ref={textInputContainerRef}
            >
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <textarea
                  ref={textareaRef}
                  className="w-80 h-auto p-2 border border-gray-300 rounded-md"
                  placeholder="Type your text here..."
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  onInput={handleTextareaInput}
                  onBlur={handleTextareaBlur}
                ></textarea>
              </div>
            </div>
          )}
          {typedText.trim() && !showInput && (
            <div className="absolute bottom-24 w-[85%] bg-white p-1 px-2 rounded-lg text-[14px] mb-4 font-lexend">
              <p className="text-black">{typedText}</p>
            </div>
          )}
          {showLocationInput && (
            <div className="absolute inset-0 bg-white flex flex-col p-4">
              <LocationInput
                initialLocation={locationInputValue}
                onSelectLocation={handleSelectLocation}
                onClose={handleCloseLocationInput}
              />
            </div>
          )}
          {showLinkInput && (
            <div className="absolute inset-0 bg-white flex flex-col p-4">
              <LinkInput
                initialLink={linkInputValue}
                onSelectLink={handleSelectLink}
                setShowLinkInput={setShowLinkInput}
                onClose={handleCloseLinkInput}
              />
            </div>
          )}
          <div className="flex justify-between absolute bottom-6 left-3 w-[90%] ">
            <div className="flex justify-between">
              {locationInputValue && !showLinkInput && !showLocationInput && (
                <div className="flex items-center mr-4">
                  <div className="relative text-black font-lexend text-[10px] rounded-lg bg-white flex justify-start items-center p-2 w-auto">
                    <LocationSVG height="12" width="12" stroke="#FC5A30" />
                    <p className="ml-1 text-[10px] font-lexend font-light">
                      {truncateUrl(locationInputValue, 20)}
                    </p>
                    <button
                      className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2"
                      onClick={() => setLocationInputValue("")}
                    >
                      <img
                        src={"/assets/green_close_icon.svg"}
                        alt="close icon"
                        width={14}
                        height={14}
                      />
                    </button>
                  </div>
                </div>
              )}
              {linkInputValue && !showLinkInput && !showLocationInput && (
                <div className=" flex items-center">
                  <div className="relative text-black font-lexend text-[10px] rounded-lg bg-white flex justify-start items-center p-2 w-auto">
                    <LinkSVG height="12" width="12" stroke="#FC5A30" />
                    <p className="ml-1 text-[10px] font-lexend font-light">
                      {truncateUrl(linkTextValue, 20)}
                    </p>
                    <button
                      className="absolute top-0 right-0 transform -translate-y-1/2 translate-x-1/2"
                      onClick={() => setLinkInputValue("")}
                    >
                      <img
                        src={"/assets/green_close_icon.svg"}
                        alt="close icon"
                        width={14}
                        height={14}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
            {!showLinkInput && !showLocationInput && (
              <button
                disabled={isSubmitDisabled}
                onClick={handleSubmit}
                className={`py-2 px-4 self-center rounded-2xl font-lexend text-body font-normal border-0 ${
                  isSubmitDisabled
                    ? "text-ui-90 bg-ui-10"
                    : "text-white bg-orange"
                }`}
              >
                Post
              </button>
            )}
          </div>
        </div>
      ) : (
        <p>No file uploaded yet.</p>
      )}
    </div>
  );
}

export default CreatePostPage;
