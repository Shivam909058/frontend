// hooks
import { useCheckUserNameMutation } from "../../../hooks/useCheckUsernameMutation";

// components
import { FieldLayout } from "./FieldLayout";
import { FormLayout } from "./FormLayout";

// constants
import { FIELD, FORM_ACTIONS } from "../constants";

// types
import { useCallback, type ReactElement, useState, useEffect } from "react";

const BasicInfoForm = ({
  onNext,
  onBack,
  values,
  errors,
  onAction,
}: {
  onNext: () => void;
  onBack: () => void;
  values: { [x: string]: any };
  errors?: { [x: string]: any };
  onAction: (action: { type: FORM_ACTIONS; payload: any }) => void;
}): ReactElement => {
  const [localName, setLocalName] = useState(values[FIELD.NAME]);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const checkUsernameMutation = useCheckUserNameMutation();

  useEffect(() => {
    setLocalName(values[FIELD.NAME]);
  }, [values[FIELD.NAME]]);

  const onChangeField = useCallback(
    (event: { target: HTMLInputElement | HTMLTextAreaElement }) => {
      const targetEl = event.target;
      const fieldId = targetEl.id;
      let value = targetEl.value;

      if (fieldId === FIELD.NAME) {
        setLocalName(value);
      }

      if (fieldId === FIELD.USERNAME) {
        // Convert to lowercase and remove spaces
        value = value.toLowerCase().replace(/\s+/g, "");
      }

      onAction({ type: FORM_ACTIONS.ON_CHANGE, payload: { fieldId, value } });
    },
    [onAction]
  );

  const handleNext = async () => {
    try {
      // Check username availability before proceeding
      await checkUsernameMutation.mutateAsync(values[FIELD.USERNAME]);
      setUsernameError(null);
      onNext();
    } catch (error) {
      if (error instanceof Error) {
        setUsernameError(error.message);
      }
    }
  };

  const isFormComplete = () => {
    if (!values[FIELD.NAME] || !values[FIELD.USERNAME]) {
      return false;
    }
    return true;
  };

  return (
    <FormLayout
      onBack={onBack}
      currentStep={1}
      totalStep={1}
      title={"Let's get you started"}
      description={"Complete your profile to get started"}
      nextButtonCTA="Submit"
      isNextDisabled={!isFormComplete()}
      onNext={handleNext}
    >
      <section
        data-id="form-section"
        className="mt-10 flex flex-col gap-7 text-ui-90 text-body font-lexend font-light"
      >
        <FieldLayout title="Name*" error={errors?.[FIELD.NAME]}>
          <input
            id={FIELD.NAME}
            name="name"
            type="text"
            placeholder="Enter your name"
            value={localName}
            onChange={onChangeField}
            className={`p-3 outline-none rounded-xl focus:border-purple relative w-full ${
              errors?.[FIELD.NAME]
                ? "border-0.8 border-negative-30"
                : "border-0.8 border-ui-10"
            }`}
            autoCapitalize="none"
          />
        </FieldLayout>

        <FieldLayout
          title="Username*"
          error={usernameError || errors?.[FIELD.USERNAME]}
        >
          <input
            id={FIELD.USERNAME}
            name="username"
            type="text"
            placeholder="Choose a unique username"
            value={values[FIELD.USERNAME] || ""}
            onChange={onChangeField}
            className={`p-3 outline-none rounded-xl focus:border-purple relative w-full ${
              usernameError || errors?.[FIELD.USERNAME]
                ? "border-0.8 border-negative-30"
                : "border-0.8 border-ui-10"
            }`}
            autoCapitalize="none"
          />
          {/* {usernameError && (
            <div className="text-negative-30 text-sm mt-1">{usernameError}</div>
          )} */}
        </FieldLayout>

        <FieldLayout title="Bio" error={errors?.[FIELD.BIO]}>
          <textarea
            placeholder={`What's you like to do, tell us in 150 characters`}
            name="description"
            id={FIELD.BIO}
            rows={6}
            className={`p-3 outline-none rounded-xl focus:border-purple relative ${
              errors?.[FIELD.BIO]
                ? "border-0.8 border-negative-30"
                : "border-0.8 border-ui-10"
            }`}
            value={values[FIELD.BIO]}
            onChange={onChangeField}
            maxLength={150}
          />
          <div className="absolute right-2 bottom-2 font-lexend text-thin text-ui-50">
            {values[FIELD.BIO].length} / 150
          </div>
        </FieldLayout>
        <FieldLayout title="Your Location" error={errors?.[FIELD.LOCATION]}>
          <input
            id={FIELD.LOCATION}
            name="location"
            type="text"
            value={
              values[FIELD.LOCATION] === "null" ? "" : values[FIELD.LOCATION]
            }
            onChange={onChangeField}
            placeholder="Where are you located?"
            className={
              "rounded-xl p-3 text-ui-90 border-0.8 border-ui-10 focus:border-purple outline-none"
            }
          />
        </FieldLayout>
      </section>
    </FormLayout>
  );
};

export { BasicInfoForm };
