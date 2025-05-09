// hooks
import { useCallback, useState, useEffect } from "react";
import { useCopyToClipboard } from "react-use";
import type { CopyToClipboardState } from "react-use/lib/useCopyToClipboard";

// Custom hook to handle clipboard operations
const useCustomCopyToClipboard = (): [
  CopyToClipboardState,
  (value: string) => void
] => {
  const [state, copyToClipboard] = useCopyToClipboard();
  const [derivedState, setDerivedState] = useState<CopyToClipboardState>(state);

  useEffect(() => {
    setDerivedState(state);
    const timerId = setTimeout(() => {
      setDerivedState({
        value: undefined,
        error: undefined,
        noUserInteraction: true,
      });
    }, 2000);

    return () => clearTimeout(timerId);
  }, [state]);

  return [derivedState, copyToClipboard];
};

// ShareButton Component
export const ShareButton = ({
  noBg = false,
  postId = null,
  height = 13,
  width = 13,
  style = "",
  username,
  whiteIcon = false,
}: {
  noBg?: boolean;
  postId?: string | null;
  height?: number;
  width?: number;
  style?: string;
  username?: string;
  whiteIcon?: boolean;
}) => {
  const [state, copyToClipboard] = useCustomCopyToClipboard();

  const handleShareProfile = useCallback(() => {
    if (!window?.location?.origin) {
      return;
    }

    const baseUrl = window.location.origin;
    const finalUrl =
      postId && username
        ? `${baseUrl}/${username}?post_id=${postId}`
        : window.location.href;

    if (navigator && navigator.share) {
      return navigator.share({
        url: finalUrl,
      });
    }

    copyToClipboard(finalUrl);
  }, [copyToClipboard, postId, username]);

  return (
    <button
      className={`w-6 h-6 rounded-full ${
        noBg ? "" : "bg-darkYellow "
      } flex justify-center items-center`}
      onClick={handleShareProfile}
    >
      {state.value ? (
        <img src="/assets/check.svg" alt="tick icon" height={13} width={13} />
      ) : whiteIcon ? (
        <img
          src="/assets/white_share_icon.svg"
          alt="share icon"
          height={height}
          width={width}
          className={style}
        />
      ) : (
        <img
          src="/assets/share.svg"
          alt="share icon"
          height={height}
          width={width}
          className={style}
        />
      )}
    </button>
  );
};
