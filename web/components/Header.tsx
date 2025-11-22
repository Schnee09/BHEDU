"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  is_read: boolean;
  created_at: string;
}

interface HeaderProps {
  profile: { 
    full_name?: string | null; 
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    role?: string;
  } | null;
}

export default function Header({ profile }: HeaderProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      await supabase
        .from('user_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      // Mock notifications for now (will be replaced with actual notification system)
      const mockNotifications: Notification[] = [
        {
          id: '1',
          user_id: profile?.email || '',
          title: 'Welcome!',
          message: 'Welcome to BH-EDU Management System',
          type: 'info',
          is_read: false,
          created_at: new Date().toISOString()
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [profile?.email]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSearch(false);
      setSearchQuery("");
    }
  };

  const getInitials = () => {
    if (profile?.first_name && profile?.last_name) {
      return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
    }
    if (profile?.full_name) {
      const parts = profile.full_name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return profile.full_name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const quickActions = [
    { label: 'Mark Attendance', icon: '✓', href: '/dashboard/attendance', show: true },
    { label: 'Add Student', icon: '👤', href: '/dashboard/students?action=add', show: profile?.role === 'admin' },
    { label: 'Create Assignment', icon: '📝', href: '/dashboard/assignments?action=add', show: profile?.role === 'teacher' || profile?.role === 'admin' },
    { label: 'View Reports', icon: '📊', href: '/dashboard/reports', show: profile?.role === 'admin' },
    { label: 'Import Students', icon: '📥', href: '/dashboard/import', show: profile?.role === 'admin' },
  ].filter(action => action.show);

  return (
   <header className="h-16 bg-gradient-to-r from-amber-600 to-yellow-600 shadow-md flex items-center justify-between px-6 relative z-50">
     {/* Left Section - Logo & Title */}
     <div className="flex items-center gap-4">
       <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition">
         <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center font-bold text-amber-600 shadow-sm">
           BH
         </div>
         <div className="hidden sm:block">
           <h1 className="font-bold text-white text-lg leading-tight">Bethel Heights</h1>
           <p className="text-xs text-amber-100">Educational Development</p>
         </div>
       </Link>
     </div>

     {/* Right Section - Actions & User */}
     <div className="flex items-center gap-2 sm:gap-4">
       {/* Search Button */}
       <button
         onClick={() => setShowSearch(!showSearch)}
         className="p-2 hover:bg-white/20 rounded-lg transition text-white relative"
         title="Search"
       >
         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
         </svg>
       </button>

       {/* Quick Actions */}
       <div className="relative">
         <button
           onClick={() => setShowQuickActions(!showQuickActions)}
           className="p-2 hover:bg-white/20 rounded-lg transition text-white"
           title="Quick Actions"
         >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
           </svg>
         </button>

         {showQuickActions && (
           <>
             <div className="fixed inset-0" onClick={() => setShowQuickActions(false)} />
             <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
               <div className="px-4 py-2 border-b border-gray-100">
                 <p className="text-xs font-semibold text-gray-500 uppercase">Quick Actions</p>
               </div>
               {quickActions.map((action, idx) => (
                 <Link
                   key={idx}
                   href={action.href}
                   onClick={() => setShowQuickActions(false)}
                   className="flex items-center gap-3 px-4 py-2 hover:bg-amber-50 transition text-sm text-gray-700"
                 >
                   <span className="text-lg">{action.icon}</span>
                   <span>{action.label}</span>
                 </Link>
               ))}
             </div>
           </>
         )}
       </div>

       {/* Notifications */}
       <div className="relative">
         <button
           onClick={() => setShowNotifications(!showNotifications)}
           className="p-2 hover:bg-white/20 rounded-lg transition text-white relative"
           title="Notifications"
         >
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
           </svg>
           {unreadCount > 0 && (
             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
               {unreadCount}
             </span>
           )}
         </button>

         {showNotifications && (
           <>
             <div className="fixed inset-0" onClick={() => setShowNotifications(false)} />
             <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
               <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                 <p className="font-semibold text-gray-800">Notifications</p>
                 <button className="text-xs text-amber-600 hover:text-amber-700">Mark all read</button>
               </div>
               <div className="max-h-96 overflow-y-auto">
                 {notifications.length === 0 ? (
                   <div className="px-4 py-8 text-center text-gray-500">
                     <p>No notifications</p>
                   </div>
                 ) : (
                   notifications.map((notif) => (
                     <div
                       key={notif.id}
                       className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${!notif.is_read ? 'bg-amber-50' : ''}`}
                     >
                       <p className="font-medium text-sm text-gray-800">{notif.title}</p>
                       <p className="text-xs text-gray-600 mt-1">{notif.message}</p>
                       <p className="text-xs text-gray-400 mt-1">
                         {new Date(notif.created_at).toLocaleDateString()}
                       </p>
                     </div>
                   ))
                 )}
               </div>
               <div className="px-4 py-2 border-t border-gray-100">
                 <Link href="/dashboard/notifications" className="text-xs text-amber-600 hover:text-amber-700">
                   View all notifications
                 </Link>
               </div>
             </div>
           </>
         )}
       </div>

       {/* User Menu */}
       <div className="relative">
         <button
           onClick={() => setShowUserMenu(!showUserMenu)}
           className="flex items-center gap-2 hover:bg-white/20 rounded-lg p-2 transition"
         >
           <div className="w-8 h-8 bg-white text-amber-600 rounded-full flex items-center justify-center font-bold text-sm shadow-sm">
             {getInitials()}
           </div>
           <div className="hidden md:block text-left">
             <p className="text-sm font-medium text-white leading-tight">
               {profile?.full_name || profile?.first_name || "User"}
             </p>
             <p className="text-xs text-amber-100 capitalize">{profile?.role || "user"}</p>
           </div>
           <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
           </svg>
         </button>

         {showUserMenu && (
           <>
             <div className="fixed inset-0" onClick={() => setShowUserMenu(false)} />
             <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
               <div className="px-4 py-3 border-b border-gray-100">
                 <p className="font-semibold text-gray-800">{profile?.full_name || "User"}</p>
                 <p className="text-xs text-gray-500">{profile?.email}</p>
                 <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded capitalize">
                   {profile?.role || "user"}
                 </span>
               </div>
               <Link
                 href="/dashboard/profile"
                 onClick={() => setShowUserMenu(false)}
                 className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                 </svg>
                 <span>My Profile</span>
               </Link>
               <Link
                 href="/dashboard/settings"
                 onClick={() => setShowUserMenu(false)}
                 className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition text-sm text-gray-700"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                 </svg>
                 <span>Settings</span>
               </Link>
               <div className="border-t border-gray-100 my-2"></div>
               <button
                 onClick={() => {
                   setShowUserMenu(false);
                   handleLogout();
                 }}
                 className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition text-sm text-red-600"
               >
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
                 <span>Logout</span>
               </button>
             </div>
           </>
         )}
        </div>
      </div>

     {/* Search Overlay */}
     {showSearch && (
       <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4">
         <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
           <div className="relative">
             <input
               type="text"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Search students, courses, classes..."
               className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
               autoFocus
             />
             <button
               type="submit"
               className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
             >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
               </svg>
             </button>
           </div>
           <div className="mt-2 text-xs text-gray-500">
             <span className="font-medium">Tip:</span> Search by name, student ID, course code, or class name
           </div>
         </form>
       </div>
     )}
    </header>
  );
}
