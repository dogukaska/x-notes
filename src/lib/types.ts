export type Note = {
  id: string;
  user_id: string;
  content: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  user_id: string;
  display_name: string;
  username: string;
  bio: string;
  avatar_path: string | null;
  banner_path: string | null;
  updated_at: string;
};
