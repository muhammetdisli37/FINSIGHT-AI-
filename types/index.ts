export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  type: TransactionType;
  note: string | null;
  transaction_at: string;
  is_impulsive: boolean;
  is_recurring: boolean;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  target_date: string;
  icon: string | null;
  created_at: string;
}

export interface FinScoreBreakdown {
  gelir_durumu: number;
  hedef_bonusu: number;
  dürtüsel_ceza: number;
  gelir_puanı: number;
}

export interface FinScoreResponse {
  score: number;
  breakdown: FinScoreBreakdown;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  monthly_income: number;
  onboarding_completed: boolean;
  financial_goals: string[];
}
