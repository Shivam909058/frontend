// lib
import { Drawer } from "@material-tailwind/react";
import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

// components
import { EmailLoginInput } from "./EmailLoginInput";
import { Otp } from "./Otp";

type LoginDrawerProps = {
  close: () => void;
};

enum STEP {
  EMAIL_ID = "EMAIL_ID",
  OTP = "OTP",
}

const useLoginFormState = (initialStep?: STEP) => {
  const [currentStep, setStep] = useState(initialStep ?? STEP.EMAIL_ID);

  const switchToOTPStep = useCallback(() => {
    setStep(STEP.OTP);
  }, []);

  const switchToEmailStep = useCallback(() => {
    setStep(STEP.EMAIL_ID);
  }, []);

  return { currentStep, switchToOTPStep, switchToEmailStep };
};

export function LoginDrawer({ close }: LoginDrawerProps) {
  const { currentStep, switchToOTPStep, switchToEmailStep } = useLoginFormState(
    STEP.EMAIL_ID
  );
  const emailIdRef = useRef("");

  useEffect(() => {
    // Add overlay when component mounts
    const overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black bg-opacity-50 z-[1000]';
    document.body.appendChild(overlay);
    
    // Lock body scroll
    document.body.style.overflow = 'hidden';
    
    // Cleanup function
    return () => {
      document.body.removeChild(overlay);
      document.body.style.overflow = 'unset';
    };
  }, []);

  const onOTPSendSuccess = useCallback(
    ({ emailId }: { emailId: string }) => {
      emailIdRef.current = emailId;
      switchToOTPStep();
    },
    [switchToOTPStep]
  );

  return createPortal(
    <div className="fixed inset-0 z-[1001] flex items-end justify-center">
      <Drawer
        open
        placement="bottom"
        onClose={close}
        placeholder=""
        size={600}
        className="bg-white px-7 py-11 shadow-2xl border-0 rounded-t-3xl overflow-scroll max-w-[430px]"
        onPointerEnterCapture={() => {}}
        onPointerLeaveCapture={() => {}}
      >
        {currentStep === STEP.OTP ? (
          <Otp
            onBack={switchToEmailStep}
            close={close}
            emailId={emailIdRef.current}
          />
        ) : null}
        {currentStep === STEP.EMAIL_ID ? (
          <EmailLoginInput onNext={onOTPSendSuccess} close={() => close()} />
        ) : null}
      </Drawer>
    </div>,
    document.body
  );
}

