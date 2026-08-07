export interface IDashboardVisibilitySettings {
  notices: boolean;
  communityGoal: boolean;
  birthdays: boolean;
  banners: boolean;
  videos: boolean;
}

export type IUpdateDashboardVisibilityPayload = Partial<IDashboardVisibilitySettings>;
