export interface Diary {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  likes: number;
  likedByUser?: boolean;
  displayName?: string | null;
}
