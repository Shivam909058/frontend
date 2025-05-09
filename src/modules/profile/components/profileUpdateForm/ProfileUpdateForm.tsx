import { useCallback, useState } from "react";
import { useLatest } from "react-use";
import { BasicInfoForm } from "./components/BasicInfoForm";
import { USER_FIELD } from "../../constants";
import { FIELD, FORM_ACTIONS, STEP } from "./constants";
import { useUpdateUserMutation } from "../../hooks/useUpdateUserMutation";
import { User } from "../../types";
import type { ReactElement } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type ProfileFormState = {
  [FIELD.NAME]: string;
  [FIELD.USERNAME]: string;
  [FIELD.BIO]: string;
  [FIELD.LOCATION]?: string;
};

const getInitialState = (user: User): ProfileFormState => {
  if (!user) {
    return {
      [FIELD.NAME]: "",
      [FIELD.USERNAME]: "",
      [FIELD.BIO]: "",
      [FIELD.LOCATION]: "",
    };
  }
  try {
    return {
      [FIELD.NAME]: user.name ?? "",
      [FIELD.USERNAME]: user.username ?? "",
      [FIELD.BIO]: user.bio ?? "",
      [FIELD.LOCATION]: user.location ?? "",
    };
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return {
      [FIELD.NAME]: user.name ?? "",
      [FIELD.USERNAME]: user.username ?? "",
      [FIELD.BIO]: user.bio ?? "",
      [FIELD.LOCATION]: user.location ?? "",
    };
  }
};

const getPayload = (
  profileState: ProfileFormState
): Partial<User> & { [USER_FIELD.NAME]: string } => ({
  [USER_FIELD.NAME]: profileState[FIELD.NAME],
  [USER_FIELD.USERNAME]: profileState[FIELD.USERNAME]?.toLowerCase(),
  [USER_FIELD.BIO]: profileState[FIELD.BIO],
  [USER_FIELD.LOCATION]: profileState[FIELD.LOCATION],
});


const useProfileUpdateForm = ({ user }: { user?: User }) => {
  if (!user || typeof user.id === "undefined") {
    throw new Error("User object or user ID is undefined");
  }
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const [currentStep, setCurrentStep] = useState(STEP.BASIC_STEP);
  const [profileState, setProfileState] = useState(getInitialState(user));
  const [errors, setErrors] = useState({});
  const profileLatestState = useLatest(profileState);
  const currentStepRef = useLatest(currentStep);

  const { mutate: updateUser } = useUpdateUserMutation();

  const onBack = useCallback(() => {
    if (currentStepRef.current === STEP.BASIC_STEP) {
      navigate(returnTo ? `/${returnTo}` : "/");
      return;
    }

    if (currentStepRef.current === STEP.ADDITIONAL_INFO) {
      setCurrentStep(STEP.BASIC_STEP);
      return;
    }
  }, []);

  const onFormSubmit = useCallback(() => {
    try {
      updateUser(getPayload(profileLatestState.current) as User);
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }, [updateUser]);

  const onNext = useCallback(() => {
    try {
      onFormSubmit();
    } catch (error) {
      console.error("Error updating user:", error);
    }
  }, [onFormSubmit]);

  const onAction = useCallback(
    (action: { type: FORM_ACTIONS; payload: any }) => {
      switch (action.type) {
        case FORM_ACTIONS.ON_CHANGE: {
          setErrors((prevError) => ({
            ...prevError,
            [action.payload.fieldId]: undefined,
          }));
          setProfileState((prevState) => ({
            ...prevState,
            [action.payload.fieldId]: action.payload.value,
          }));
        }
      }
    },
    []
  );

  return { profileState, onNext, onBack, currentStep, onAction, errors };
};

export const ProfileUpdateForm = ({
  user,
}: {
  user: User | undefined;
}): ReactElement => {
  // If user data is not yet available, render a loading indicator or return null
  if (!user) {
    return <div>Loading user information...</div>; // or return null;
  }
  const { onNext, onBack, profileState, onAction, errors } =
    useProfileUpdateForm({ user });

  return (
    <div className="h-screen w-screen bg-white">
      <BasicInfoForm
        onNext={onNext}
        onBack={onBack}
        values={profileState}
        onAction={onAction}
        errors={errors}
      />
    </div>
  );
};
