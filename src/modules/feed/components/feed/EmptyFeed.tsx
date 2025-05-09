export function EmptyFeed() {
  return (
    <>
      <div className="flex flex-col text-xs leading-4 max-w-[430px] text-slate-400 font-lexend text-small font-light text-gray-500">
        <div className="flex gap-4">
          <div className="flex flex-col flex-1">
            <div className="flex flex-col px-5 py-14 text-center bg-[#fdfdfd] rounded-3xl h-[220px] w-[164px] border-dashed border-[3px] cursor-pointer">
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/e2a2d0aea49d6dd17a75f393a9d17b50b496a76d1227d82886b9838d434e243d?"
                className="self-center w-5 aspect-square"
              />
              <div className="mt-3 ">
                Add a travel tip, hack, recommendations & more
              </div>
            </div>
            <div className="flex flex-col px-6 py-14 mt-4 text-center bg-[#fdfdfd] rounded-3xl border-dashed h-[220px] w-[164px] border-[3px] cursor-pointer">
              <img
                loading="lazy"
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/e2a2d0aea49d6dd17a75f393a9d17b50b496a76d1227d82886b9838d434e243d?"
                className="self-center w-5 aspect-square"
              />
              <div className="mt-3">
                Add your fav place’s pic & tell us why you like it
              </div>
            </div>
          </div>
          <div className="flex flex-col flex-1 px-6 py-28 text-center bg-[#fdfdfd] rounded-3xl border-dashed border-[3px] cursor-pointer">
            <img
              loading="lazy"
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/e2a2d0aea49d6dd17a75f393a9d17b50b496a76d1227d82886b9838d434e243d?"
              className="self-center mt-16 w-5 aspect-square"
            />
            <div className="mt-3">
              Tell us about your travel plans, wish-lists, stories and more
            </div>
          </div>
        </div>
        <div className="flex justify-center items-center px-16 py-16 mt-4 w-full text-center bg-[#fdfdfd] rounded-3xl border-dashed border-[3px] cursor-pointer">
          <div className="flex flex-col max-w-full w-[130px]">
            <img
              loading="lazy"
              src="https://cdn.builder.io/api/v1/image/assets/TEMP/e2a2d0aea49d6dd17a75f393a9d17b50b496a76d1227d82886b9838d434e243d?"
              className="self-center w-5 aspect-square"
            />
            <div className="mt-3">
              Add links to your fav blogs, places, products & more
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
