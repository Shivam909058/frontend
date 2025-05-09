// lib
import { MouseEventHandler } from "react";

// components
import { FieldLayout } from "./FieldLayout";
import { FormLayout } from "./FormLayout";

// constants
import { FORM_ACTIONS, FIELD } from "../constants";
import { ADDITIONAL_QUESTION_TYPE } from "../../../constants";
import { useVisibilityToggle } from "../../../../../hooks/useVisibilityToggle";

enum TRAVEL_TYPE_OPTIONS {
  BACKPACKER = "Backpacker",
  EXPLORER = "Explorer",
  LUXURY = "Luxury",
  PHOTOGRAPHER = "Photography",
  DIGITAL_NOMAD = "Digital Nomad",
  SOLO = "Solo",
  VOLUNTEER = "Volunteer",
  ROAD_TRIPPING = "Road Tripping",
  OTHER = "Other",
}

export const AdditionalInfoForm = ({
  onNext,
  onBack,
  values,
  onAction,
  errors,
}: {
  onNext: () => void;
  onBack: () => void;
  values: { [x: string]: any };
  onAction: (action: { type: FORM_ACTIONS; payload: any }) => void;
  errors?: { [x: string]: any };
}) => {
  const isTravelStyleOther =
    !!values[FIELD.ADDITIONAL_INFO][ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE] &&
    Object.values(TRAVEL_TYPE_OPTIONS).every(
      (opt) =>
        opt !==
        values[FIELD.ADDITIONAL_INFO][ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE]
    );

  const { isVisible, show, hide } = useVisibilityToggle(isTravelStyleOther);
  const additionalValues = values[FIELD.ADDITIONAL_INFO];

  const handleTravelTypeSelect: MouseEventHandler<HTMLDivElement> = (event) => {
    const targetEl = event.target as unknown as HTMLDivElement;
    const travelType = targetEl.getAttribute("data-travel-type");

    if (travelType === TRAVEL_TYPE_OPTIONS.OTHER) {
      show();
      return onAction({
        type: FORM_ACTIONS.ON_CHANGE,
        payload: {
          fieldId: FIELD.ADDITIONAL_INFO,
          value: {
            ...additionalValues,
            [ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE]: "",
          },
        },
      });
    }

    hide();
    onAction({
      type: FORM_ACTIONS.ON_CHANGE,
      payload: {
        fieldId: FIELD.ADDITIONAL_INFO,
        value: {
          ...additionalValues,
          [ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE]: travelType,
        },
      },
    });
  };

  const onChangeAnswer = (event: { target: HTMLInputElement }) => {
    const targetEl = event.target;
    const fieldId = targetEl.id;
    const value = targetEl.value;

    onAction({
      type: FORM_ACTIONS.ON_CHANGE,
      payload: {
        fieldId: FIELD.ADDITIONAL_INFO,
        value: { ...additionalValues, [fieldId]: value },
      },
    });
  };

  const error = errors?.[FIELD.ADDITIONAL_INFO];

  return (
    <FormLayout
      title="Let’s add some final touches"
      description="Help us paint a picture of your travel journey (psst : Answer at-least 3 questions for cool highlights)"
      currentStep={2}
      totalStep={2}
      nextButtonCTA="Save"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!!errors?.[FIELD.ADDITIONAL_INFO]}
    >
      <section data-id="form-section" className="mt-10 flex flex-col gap-7">
        <FieldLayout
          title="How many cities have you travelled?"
          error={
            values[FIELD.ADDITIONAL_INFO][
              ADDITIONAL_QUESTION_TYPE.CITIES_TRAVELED
            ]
              ? undefined
              : errors?.[FIELD.ADDITIONAL_INFO]
          }
        >
          <input
            id={ADDITIONAL_QUESTION_TYPE.CITIES_TRAVELED}
            name="cities traveled"
            type="number"
            value={
              values[FIELD.ADDITIONAL_INFO][
                ADDITIONAL_QUESTION_TYPE.CITIES_TRAVELED
              ] === "null"
                ? ""
                : values[FIELD.ADDITIONAL_INFO][
                    ADDITIONAL_QUESTION_TYPE.CITIES_TRAVELED
                  ]
            }
            onChange={onChangeAnswer}
            className={`rounded-xl p-3 text-ui-90 text-small font-lexend font-light hover:border-purple focus:border-purple ${
              error &&
              !values[FIELD.ADDITIONAL_INFO][
                ADDITIONAL_QUESTION_TYPE.CITIES_TRAVELED
              ]
                ? "border-0.8 border-negative-30"
                : "border-0.8 border-ui-10"
            }`}
          />
        </FieldLayout>
        <FieldLayout
          title="What is your travel style?"
          error={
            values[FIELD.ADDITIONAL_INFO][ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE]
              ? undefined
              : errors?.[FIELD.ADDITIONAL_INFO]
          }
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-row gap-3 flex-wrap">
              {Object.values(TRAVEL_TYPE_OPTIONS).map((option) => {
                const currentValue =
                  values[FIELD.ADDITIONAL_INFO][
                    ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE
                  ];
                const isSelected =
                  option === TRAVEL_TYPE_OPTIONS.OTHER
                    ? isVisible
                    : currentValue === option;
                return (
                  <div
                    className={`uppercase px-4 py-3 rounded-xl text-small font-lexend border-0.8 border-solid ${
                      isSelected
                        ? "border-darkYellow bg-lightYellow text-ui-90"
                        : "border-ui-50 bg-white text-ui-50"
                    }`}
                    data-travel-type={option}
                    onClick={handleTravelTypeSelect}
                  >
                    {option}
                  </div>
                );
              })}
            </div>
            <div className="w-full relative">
              {isVisible ? (
                <input
                  id={ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE}
                  name=""
                  type="text"
                  value={
                    values[FIELD.ADDITIONAL_INFO][
                      ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE
                    ] === "null"
                      ? ""
                      : values[FIELD.ADDITIONAL_INFO][
                          ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE
                        ]
                  }
                  onChange={onChangeAnswer}
                  maxLength={20}
                  className={`w-full rounded-xl p-3 text-ui-90 text-small font-lexend font-light border-0.8 border-darkYellow bg-lightYellow`}
                />
              ) : null}
              {isVisible ? (
                <div className="absolute right-4 bottom-4 font-lexend text-[10px] text-ui-50">
                  {values[FIELD.ADDITIONAL_INFO][
                    ADDITIONAL_QUESTION_TYPE.TRAVEL_STYLE
                  ]?.length ?? 0}{" "}
                  / 20
                </div>
              ) : null}
            </div>
          </div>
        </FieldLayout>
        <FieldLayout
          title="What's your go-to travel activity?"
          error={
            values[FIELD.ADDITIONAL_INFO][
              ADDITIONAL_QUESTION_TYPE.TRAVEL_ACTIVITY
            ]
              ? undefined
              : errors?.[FIELD.ADDITIONAL_INFO]
          }
        >
          <input
            name="travel activity"
            type="text"
            id={ADDITIONAL_QUESTION_TYPE.TRAVEL_ACTIVITY}
            value={
              values[FIELD.ADDITIONAL_INFO][
                ADDITIONAL_QUESTION_TYPE.TRAVEL_ACTIVITY
              ] === "null"
                ? ""
                : values[FIELD.ADDITIONAL_INFO][
                    ADDITIONAL_QUESTION_TYPE.TRAVEL_ACTIVITY
                  ]
            }
            onChange={onChangeAnswer}
            placeholder="like “Hiking”, “Shopping”, “Historical Tours”, etc."
            className={`rounded-xl p-3 text-ui-90 text-small font-lexend font-light hover:border-purple focus:border-purple ${
              error &&
              !values[FIELD.ADDITIONAL_INFO][
                ADDITIONAL_QUESTION_TYPE.TRAVEL_ACTIVITY
              ]
                ? "border-0.8 border-negative-30"
                : "border-0.8 border-ui-10"
            }`}
            maxLength={20}
          />
          <div className="absolute right-4 bottom-4 font-lexend text-[10px] text-ui-50">
            {values[FIELD.ADDITIONAL_INFO][
              ADDITIONAL_QUESTION_TYPE.TRAVEL_ACTIVITY
            ]?.length ?? 0}{" "}
            / 20
          </div>
        </FieldLayout>
        <FieldLayout
          title="Name one item you never travel without?"
          error={
            values[FIELD.ADDITIONAL_INFO][ADDITIONAL_QUESTION_TYPE.TRAVEL_ITEM]
              ? undefined
              : errors?.[FIELD.ADDITIONAL_INFO]
          }
        >
          <input
            name="travel item"
            type="text"
            id={ADDITIONAL_QUESTION_TYPE.TRAVEL_ITEM}
            value={
              values[FIELD.ADDITIONAL_INFO][
                ADDITIONAL_QUESTION_TYPE.TRAVEL_ITEM
              ] === "null"
                ? ""
                : values[FIELD.ADDITIONAL_INFO][
                    ADDITIONAL_QUESTION_TYPE.TRAVEL_ITEM
                  ]
            }
            onChange={onChangeAnswer}
            placeholder="like “camera”, “journal”, “sunscreen”, etc"
            className={`rounded-xl p-3 text-ui-90 text-small font-lexend font-light hover:border-purple focus:border-purple ${
              error &&
              !values[FIELD.ADDITIONAL_INFO][
                ADDITIONAL_QUESTION_TYPE.TRAVEL_ITEM
              ]
                ? "border-0.8 border-negative-30"
                : "border-0.8 border-ui-10"
            }`}
          />
        </FieldLayout>
        <FieldLayout
          title="Which is your go-to travel destination?"
          error={
            values[FIELD.ADDITIONAL_INFO][
              ADDITIONAL_QUESTION_TYPE.TRAVEL_DESTINATION
            ]
              ? undefined
              : errors?.[FIELD.ADDITIONAL_INFO]
          }
        >
          <input
            name="travel destination"
            type="text"
            id={ADDITIONAL_QUESTION_TYPE.TRAVEL_DESTINATION}
            value={
              values[FIELD.ADDITIONAL_INFO][
                ADDITIONAL_QUESTION_TYPE.TRAVEL_DESTINATION
              ] === "null"
                ? ""
                : values[FIELD.ADDITIONAL_INFO][
                    ADDITIONAL_QUESTION_TYPE.TRAVEL_DESTINATION
                  ]
            }
            onChange={onChangeAnswer}
            placeholder="like “kerala”, “bangkok”, “Turkey”, etc"
            className={`rounded-xl p-3 text-ui-90 text-small font-lexend font-light hover:border-purple focus:border-purple ${
              error &&
              !values[FIELD.ADDITIONAL_INFO][
                ADDITIONAL_QUESTION_TYPE.TRAVEL_DESTINATION
              ]
                ? "border-0.8 border-negative-30"
                : "border-0.8 border-ui-10"
            }`}
          />
        </FieldLayout>
      </section>
    </FormLayout>
  );
};
