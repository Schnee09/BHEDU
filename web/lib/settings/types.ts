export interface Setting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  category: string;
  description: string | null;
  setting_type?: 'text' | 'number' | 'boolean' | 'json';
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_current?: boolean;
}

export interface GradingScale {
  id: string;
  name: string;
  min_score?: number;
  max_score?: number;
  grade_letter?: string;
  is_default?: boolean;
  description?: string;
  scale?: Array<{
    letter: string;
    min: number;
    max: number;
  }>;
}

export interface NotificationChannel {
  id: string;
  label: string;
  icon: any;
  active: boolean;
}

export interface NotificationEvent {
  id: string;
  label: string;
  description: string;
  push: boolean;
  email: boolean;
}

export interface SecuritySession {
  id?: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  current: boolean;
}

export interface ActivityLog {
  action: string;
  category: string;
  date: string;
}
