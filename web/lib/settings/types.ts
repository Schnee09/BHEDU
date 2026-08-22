export interface Setting {
  id?: string;
  key: string;
  value: string;
  setting_key?: string;
  setting_value?: string | null;
  category?: string;
  description?: string | null;
  setting_type?: 'text' | 'number' | 'boolean' | 'json';
}

export interface Semester {
  id?: string;
  name: string;
  code: string;
  start_date: string;
  end_date: string;
  is_active?: boolean;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_current?: boolean;
  semesters?: Semester[];
}

export interface GradingScaleLevel {
  letter: string;
  min: number;
  max: number;
  description?: string;
  gpa?: number;
  color?: string;
}

export interface GradingScale {
  id: string;
  name: string;
  min_score?: number;
  max_score?: number;
  grade_letter?: string;
  is_default?: boolean;
  description?: string;
  scale?: GradingScaleLevel[];
}

export interface NotificationChannel {
  id: string;
  label: string;
  description?: string;
  icon?: any;
  active: boolean;
  badge?: string;
}

export interface NotificationEvent {
  id: string;
  label: string;
  description: string;
  category?: 'academic' | 'finance' | 'timetable' | 'system';
  push: boolean;
  email: boolean;
  sms?: boolean;
  zalo?: boolean;
}

export interface NotificationTemplate {
  id: string;
  eventId: string;
  eventName: string;
  channel: 'email' | 'sms' | 'push' | 'zalo';
  titleTemplate: string;
  bodyTemplate: string;
  variables: Array<{ key: string; label: string; example: string }>;
  updatedAt?: string;
}

export interface SecurityPolicy {
  sessionTimeoutHours: number;
  requireStrongPassword: boolean;
  enforce2FAForAdmins: boolean;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
}

export interface SecuritySession {
  id?: string;
  device: string;
  browser: string;
  ip: string;
  location: string;
  current: boolean;
  lastActive?: string;
}

export interface ActivityLog {
  id?: string;
  action: string;
  category?: string;
  resource_type?: string;
  resource_id?: string;
  user_email?: string;
  user_role?: string;
  date?: string;
  created_at?: string;
  ip_address?: string;
}

