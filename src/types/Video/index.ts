// Portado de resgatar_app/src/types/Video/index.ts (idêntico).

export interface IVideoResponse {
  _id: string;
  memberId: string;
  url: string;
  videoId: string;
  thumbnail: string;
  title?: string;
  createdAt?: string;
}

export interface IVideoFeedItem extends IVideoResponse {
  firstName: string;
  lastName: string;
  profileImage: string | null;
}

export interface IPaginatedVideos {
  items: IVideoFeedItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IVideoListFilters {
  title?: string;
  memberId?: string;
}
