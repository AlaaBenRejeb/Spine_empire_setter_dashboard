"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  priority: "high" | "med" | "low";
}

export default function PersonalTasks({ theme }: { theme: "dark" | "light" }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const storageKey = user?.id ? `spine-empire-personal-tasks-${user.id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    const saved = localStorage.getItem(storageKey);
    if (saved) setTasks(JSON.parse(saved));
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [tasks, storageKey]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: input,
      completed: false,
      priority: "med"
    };
    setTasks([newTask, ...tasks]);
    setInput("");
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <form onSubmit={addTask} className="flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a personal task (e.g. Follow up with Dr. Smith)..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-primary transition-all text-sm"
        />
        <button type="submit" className="bg-primary text-black p-2 rounded-lg hover:brightness-110 active:scale-95 transition-all">
          <Plus size={20} />
        </button>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 hide-scrollbar">
        <AnimatePresence>
          {tasks.map((task) => (
            <motion.div 
              key={task.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-all group"
            >
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleTask(task.id)}>
                {task.completed ? (
                  <CheckCircle size={18} className="text-green-500" />
                ) : (
                  <Circle size={18} className="text-gray-500" />
                )}
                <span className={`text-sm ${task.completed ? "line-through text-gray-600" : "text-gray-200"}`}>
                  {task.text}
                </span>
              </div>
              <button 
                onClick={() => deleteTask(task.id)}
                className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-600 text-sm italic">
            No personal tasks yet. Get started above!
          </div>
        )}
      </div>
    </div>
  );
}
