import { PROFILE_SOCIAL_MEDIA } from "../../../profile/constants";

const socialMediaToUserNameUrlGenerator = {
  [PROFILE_SOCIAL_MEDIA.FACEBOOK as string]: (userName: string) =>
    `https://www.facebook.com/${userName}`,
  [PROFILE_SOCIAL_MEDIA.INSTAGRAM as string]: (userName: string) =>
    `https://www.instagram.com/${userName}`,
  [PROFILE_SOCIAL_MEDIA.X as string]: (userName: string) =>
    `https://www.twitter.com/${userName}`,
  [PROFILE_SOCIAL_MEDIA.YOUTUBE as string]: (userName: string) =>
    `https://www.youtube.com/${userName}`,
  default: (userName: string) =>
    userName.startsWith("http://") || userName.startsWith("https://")
      ? userName
      : `https://${userName}`,
};

export const getSocialMediaLink = ({
  type,
  userName,
}: {
  type: string;
  userName: string;
}): string => {
  const usernameLinkGenerator =
    socialMediaToUserNameUrlGenerator[type] ??
    socialMediaToUserNameUrlGenerator.default;
  return usernameLinkGenerator(userName);
};
