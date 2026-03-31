"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PhoneCall, Calendar, BarChart3, Settings, LogOut, Briefcase, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Deals Pipeline", href: "/deals", icon: Briefcase },
    { name: "My Calls", href: "/calls", icon: PhoneCall },
    { name: "Performance", href: "/performance", icon: BarChart3 },
    { name: "Bookings", href: "/bookings", icon: Calendar },
  ];

  return (
    <aside className="hidden lg:flex w-72 flex-col gap-10 h-screen sticky top-0 p-10 border-r border-glass-border bg-background transition-all duration-300">
      <div className="flex items-center gap-4 px-2 cursor-pointer">
        <div className="w-12 h-12 bg-black text-white dark:bg-white dark:text-black rounded-xl shadow-sm flex items-center justify-center border border-black transition-all">
          <Zap size={24} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-heading font-bold tracking-tight uppercase leading-none">Spine Empire</span>
          <span className="text-[10px] font-bold tracking-[0.2em] opacity-40 uppercase">Outreach Elite</span>
        </div>
      </div>

      <nav className="flex flex-col gap-2 mt-12 flex-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`p-4 rounded-xl flex items-center justify-between font-bold transition-all duration-200 group ${
                  isActive 
                    ? "bg-black text-white dark:bg-white dark:text-black shadow-lg" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-xs uppercase tracking-widest font-bold">{item.name}</span>
                </div>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-black" />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="pt-8 border-t border-glass-border flex flex-col gap-2">
        <div className="text-muted-foreground p-4 rounded-xl flex items-center gap-4 font-bold uppercase text-[10px] tracking-widest hover:bg-secondary hover:text-foreground transition-all cursor-pointer">
          <Settings size={18} /> Settings
        </div>
        <div className="text-muted-foreground p-4 rounded-xl flex items-center gap-4 font-bold uppercase text-[10px] tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-all cursor-pointer">
          <LogOut size={18} /> Sign Out
        </div>
      </div>
    </aside>
  );
}
