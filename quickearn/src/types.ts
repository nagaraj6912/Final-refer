// This type matches your 'Referstore' table structure
export interface App {
  id: string;
  name: string;
  category: string;
  referrer_bonus: number;
  referee_bonus: number;
  task: string;
  link: string;
  my_referral_link: string;
  icon_url: string; // We'll assume this field exists for the icon
}