"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneCall, Calendar, BarChart3, Settings, LogOut, Briefcase, Zap, Presentation } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Deals Pipeline", href: "/deals", icon: Briefcase },
    { name: "Onboarding", href: "/onboarding", icon: Presentation },
    { name: "My Calls", href: "/calls", icon: PhoneCall },
    { name: "Performance", href: "/performance", icon: BarChart3 },
    { name: "Bookings", href: "/bookings", icon: Calendar },
  ];

  return (
    <aside className="hidden lg:flex w-64 flex-shrink-0 flex-col gap-6 h-screen sticky top-0 p-6 border-r border-glass-border bg-background transition-all duration-300 overflow-hidden shadow-2xl z-40">
      <div className="flex items-center gap-3 px-1 cursor-pointer">
        <div className="w-10 h-10 bg-black text-white dark:bg-white dark:text-black rounded-lg shadow-sm flex items-center justify-center border border-black transition-all">
          <Zap size={20} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-heading font-bold tracking-tight uppercase leading-none italic">Spine Engine</span>
          <span className="text-[9px] font-bold tracking-[0.1em] opacity-40 uppercase">Setter Terminal</span>
        </div>
      </div>

      <nav className="flex flex-col gap-1 mt-4 flex-1 overflow-y-auto hide-scrollbar custom-scrollbar pr-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`p-3 rounded-lg flex items-center justify-between font-bold transition-all duration-200 group ${
                  isActive 
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-md" 
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] uppercase tracking-widest font-black leading-none">{item.name}</span>
                </div>
                {isActive && (
                  <div className="w-1 h-1 rounded-full bg-white dark:bg-black" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-glass-border flex flex-col gap-1">
        <Link href="/settings" className="text-muted-foreground p-3 rounded-lg flex items-center gap-3 font-bold uppercase text-[9px] tracking-widest hover:bg-secondary/50 hover:text-foreground transition-all cursor-pointer">
          <Settings size={16} /> Settings
        </Link>
        <div onClick={signOut} className="text-muted-foreground p-3 rounded-lg flex items-center gap-3 font-bold uppercase text-[9px] tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer">
          <LogOut size={16} /> Exit
        </div>
      </div>
    </aside>
  );
}
