export type Post = {
  id: string;
  description: string;
  image_url?: string;
  video_url?: string;
  location_url?: string;
  web_url?: string;
  title?: string;
  created_by: string;
  created_at: string;
  place_id?: string;
  caption: string;
  comments?: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    user: {
      username: string;
      profile_picture_url: string;
    };
  } | null;
};
