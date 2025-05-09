// LocationInput.tsx
import React, { useState, useEffect, ChangeEvent } from "react";

interface LocationInputProps {
  initialLocation?: string;
  onSelectLocation: (description: string, placeId: string) => void;
  onClose: () => void;
}

const LocationInput: React.FC<LocationInputProps> = ({
  initialLocation = "",
  onSelectLocation,
  onClose,
}) => {
  const [locationInputValue, setLocationInputValue] = useState(initialLocation);
  const [predictions, setPredictions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locationIsSelected, setLocationIsSelected] = useState(false);

  useEffect(() => {
    if (locationInputValue) {
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/googleMapApi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ place: locationInputValue }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.status === "OK") {
            setPredictions(data.predictions);
            setShowDropdown(true);
          }
        });
    } else {
      setPredictions([]);
      setShowDropdown(false);
    }
  }, [locationInputValue]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setLocationIsSelected(false);
    setLocationInputValue(e.target.value);
  };

  const handleSelect = (description: string, placeId: string) => {
    setLocationIsSelected(true);
    setLocationInputValue(description);
    onSelectLocation(description, placeId);
  };

  return (
    <div className="relative pt-6">
      <div className="flex justify-start">
        <button onClick={onClose}>
          <img
            src={"/assets/new_close_icon.svg"}
            alt="close icon"
            width={25}
            height={25}
          />
        </button>
        <h1 className="ml-24 font-lexend text-h5 font-semibold">Locations</h1>
      </div>

      <div className="flex flex-row gap-2 w-full mt-5">
        <div className="flex flex-row gap-2 bg-ui-5 w-full border-0 rounded-xl p-2">
          <img
            src={"/assets/location.svg"}
            alt="location img"
            width={12}
            height={12}
          />
          <input
            type="text"
            value={locationInputValue}
            onChange={handleInputChange}
            placeholder="Search"
            className="bg-ui-5 w-full text-ui-90 text-[12px] font-lexend font-normal outline-none h-8"
          />
        </div>
      </div>
      {showDropdown && !locationIsSelected && (
        <div className="dropdown mt-2 bg-white shadow-lg rounded-md overflow-hidden border border-gray-200 w-[98%] absolute">
          {predictions.map((prediction, index) => (
            <div
              key={index}
              onClick={() =>
                handleSelect(
                  // @ts-ignore
                  prediction.structured_formatting.main_text,
                  // @ts-ignore
                  prediction.place_id
                )
              }
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex flex-col"
            >
              <span className="font-semibold">
                {
                  // @ts-ignore
                  prediction.structured_formatting.main_text
                }
              </span>
              <span className="text-sm text-gray-500">
                {
                  // @ts-ignore
                  prediction.structured_formatting.secondary_text
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
