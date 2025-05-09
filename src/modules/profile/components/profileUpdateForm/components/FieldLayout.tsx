// types
import type { ReactNode, ReactElement } from "react";

export const FieldLayout = ({
  children,
  title,
  error,
}: {
  title: string;
  children: ReactNode;
  error?: string;
}): ReactElement => (
  <div className="flex flex-col gap-2">
    <div className="text-body text-ui-90 font-bold font-lexend">{title}</div>
    <div className="flex flex-col gap-1 relative">
      {children}
      {error ? (
        <div className="flex flex-row gap-1">
          <img
            src={"/assets/error.svg"}
            alt="error img"
            width={12}
            height={12}
          />
          <span className="text-h5-m text-negative-60 font-lexend font-normal">
            {error}
          </span>
        </div>
      ) : null}
    </div>
  </div>
);
