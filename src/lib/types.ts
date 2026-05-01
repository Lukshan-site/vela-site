export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Video = {
  id: string;
  drive_file_id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  category_id: string | null;
  created_at: string;
  category?: Category | null;
};

export type Comment = {
  id: string;
  video_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profile?: Pick<Profile, "username" | "display_name" | "avatar_url">;
};

export type VideoWithCounts = Video & {
  like_count: number;
  comment_count: number;
};
