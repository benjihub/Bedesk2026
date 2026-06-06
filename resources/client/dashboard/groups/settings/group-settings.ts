export interface GroupSiteSettings {
  brandName?: string;
  welcomeMessage?: string;

  minDeposit?: number | null;
  maxDeposit?: number | null;
  minWithdrawal?: number | null;
  maxWithdrawal?: number | null;

  banks?: string | null;
  ewallets?: string | null;
  qris?: boolean;

  rtpLink?: string | null;

  // How long to keep repeating the human-support ping after activation.
  // 0 => unlimited until conversation is opened.
  humanSupportPingRepeatMaxSeconds?: number | null;
}

export interface GroupSettings {
  settings: GroupSiteSettings;
  // Random, per-group livechat public link token returned by API.
  public_link_token?: string;
}
