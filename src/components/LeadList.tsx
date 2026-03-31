"use client";

import { useState, useEffect } from "react";
import leadsData from "@/data/leads.json";
import { Search, Phone, CheckCircle2, User, Building2, MapPin } from "lucide-react";

export default function LeadList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState(leadsData);
  const [stats, setStats] = useState({ total: 982, dialed: 0, booked: 0 });

  useEffect(() => {
    // Load local stats if any
    const savedStats = localStorage.getItem("spine-empire-stats");
    if (savedStats) setStats(JSON.parse(savedStats));
  }, []);

  const filteredLeads = leads.filter((l) =>
    l["Practice Name"].toLowerCase().includes(searchTerm.toLowerCase()) ||
    l["First Name"].toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Search Header */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-500 group-focus-within:text-primary transition-colors">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search 982 leads by clinic or owner..."
          className="w-full bg-glass border border-glass-border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-primary transition-all backdrop-blur-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Lead Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 hide-scrollbar pb-20">
        {filteredLeads.slice(0, 50).map((lead, idx) => (
          <div key={idx} className="glass-card p-5 group animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: `${idx * 50}ms` }}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-xs text-primary font-bold tracking-widest uppercase mb-1 glow-text">Potential Target</span>
                <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors line-clamp-1">
                  {lead["Practice Name"]}
                </h3>
              </div>
              <div className="bg-primary/20 p-2 rounded-lg border border-primary/30 group-hover:scale-110 transition-transform">
                <Building2 size={16} className="text-primary" />
              </div>
            </div>

            <div className="space-y-2 text-sm text-gray-400 mb-6">
              <div className="flex items-center gap-2">
                <User size={14} className="text-primary/70" />
                <span className="font-medium text-white">{lead["First Name"]} (Decision Maker)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{lead["City"]}, {lead["State"]}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => window.location.href = `tel:${lead["Phone"]}`}
                className="flex-1 bg-primary text-black font-bold py-2 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-lg hover:shadow-primary/20"
              >
                <Phone size={14} />
                Call Now
              </button>
              <button className="p-2 border border-glass-border rounded-lg text-gray-500 hover:text-white hover:border-white transition-colors">
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
