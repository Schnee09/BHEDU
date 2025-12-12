/**
 * Icon Library - Heroicons Wrapper
 * Professional SVG icons for UI (NO EMOJIS!)
 */

import {
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  ClipboardDocumentListIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  BellIcon,
  Cog6ToothIcon,
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  PresentationChartLineIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  ChevronRightIcon,
  Bars3Icon,
  XMarkIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ArchiveBoxIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  LockClosedIcon,
  CreditCardIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

import {
  AcademicCapIcon as AcademicCapSolid,
  UserGroupIcon as UserGroupSolid,
  BookOpenIcon as BookOpenSolid,
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
} from '@heroicons/react/24/solid';

// Export outline icons (default)
export const Icons = {
  // Navigation
  Home: HomeIcon,
  Users: UsersIcon,
  Settings: Cog6ToothIcon,
  Notifications: BellIcon,
  Menu: Bars3Icon,
  Close: XMarkIcon,
  
  // Education specific
  Students: UserGroupIcon,
  Teachers: AcademicCapIcon,
  Classes: BookOpenIcon,
  Assignments: ClipboardDocumentListIcon,
  Attendance: CalendarDaysIcon,
  Grades: DocumentTextIcon,
  Progress: PresentationChartLineIcon,
  Finance: CurrencyDollarIcon,
  
  // Actions
  View: EyeIcon,
  Edit: PencilIcon,
  Delete: TrashIcon,
  Add: PlusIcon,
  ChevronRight: ChevronRightIcon,
  ChevronDown: ChevronDownIcon,
  Filter: FunnelIcon,
  Search: MagnifyingGlassIcon,
  Download: ArrowDownTrayIcon,
  Archive: ArchiveBoxIcon,
  Save: DocumentArrowDownIcon,
  Calendar: CalendarIcon,
  Lock: LockClosedIcon,
  CreditCard: CreditCardIcon,
  Phone: PhoneIcon,
  Mail: EnvelopeIcon,
  Location: MapPinIcon,
  
  // Status
  Success: CheckCircleIcon,
  Error: XCircleIcon,
  Warning: ExclamationTriangleIcon,
  Info: InformationCircleIcon,
  TrendUp: ArrowTrendingUpIcon,
  TrendDown: ArrowTrendingDownIcon,
  
  // Analytics
  Chart: ChartBarIcon,
} as const;

// Export solid icons for special cases
export const IconsSolid = {
  Students: UserGroupSolid,
  Teachers: AcademicCapSolid,
  Classes: BookOpenSolid,
  Success: CheckCircleSolid,
  Error: XCircleSolid,
} as const;

/**
 * Icon Wrapper Component
 * Provides consistent sizing and styling
 */
interface IconProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES = {
  xs: 'w-4 h-4',
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-10 h-10',
} as const;

export function Icon({ icon: IconComponent, className = '', size = 'md' }: IconProps) {
  return <IconComponent className={`${SIZE_CLASSES[size]} ${className}`} />;
}

export default Icons;
