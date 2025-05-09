// components
import { IconButton } from "@material-tailwind/react";

// types
import type { ReactNode } from "react";

export const FormStepHeader = ({
  onBack,
  currentStep,
  totalStep,
}: {
  onBack: () => void;
  currentStep: number;
  totalStep: number;
}) => {
  return (
    <div className="flex flex-row gap-3 items-center">
      <IconButton
        variant="outlined"
        placeholder="back button"
        className="rounded-full border-1 border-ui-50"
        size="sm"
        onClick={onBack}
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        <img
          src={"/assets/chevronLeft.svg"}
          alt="back icon"
          width={20}
          height={20}
        />
      </IconButton>
      <div className="font-lexend text-body text-ui-50">
        <span className="text-black">{currentStep}</span>/{totalStep}
      </div>
    </div>
  );
};

export const FormLayout = ({
  onBack,
  currentStep,
  totalStep,
  children,
  title,
  description,
  nextButtonCTA,
  onNext,
  isNextDisabled,
}: {
  onBack: () => void;
  currentStep: number;
  totalStep: number;
  children: ReactNode;
  title: string;
  description: string;
  nextButtonCTA: string;
  onNext: () => void;
  isNextDisabled: boolean;
}) => {
  return (
    <div className="flex flex-col px-7 py-14 relative bg-white mx-auto max-w-[430px]">
      <FormStepHeader
        totalStep={totalStep}
        currentStep={currentStep}
        onBack={onBack}
      />
      <div className="mt-9 flex flex-col">
        <div className="flex flex-col gap-2">
          <h1 className="text-big text-ui-90 font-bold font-lexend">{title}</h1>
          <div className="text-thin text-ui-90 font-lexend">{description}</div>
        </div>
      </div>
      {children}
      <div className="w-full flex flex-row justify-center mt-6">
        <button
          className={`bg-orange py-3 px-8 text-center w-32 text-white rounded-2xl ${
            isNextDisabled ? "bg-ui-50 cursor-not-allowed" : "cursor-pointer"
          }`}
          onClick={isNextDisabled ? undefined : onNext}
          disabled={isNextDisabled}
        >
          {nextButtonCTA}
        </button>
      </div>
    </div>
  );
};
