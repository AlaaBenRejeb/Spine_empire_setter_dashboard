"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { motion } from "framer-motion"
import { Shield, Zap, AlertCircle, Loader2 } from "lucide-react"

export default function JoinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!token) {
      setError("NO VALID ACCESS TOKEN DETECTED. CONTACT COMMAND OPS.")
      setLoading(false)
      return
    }

    const verifyToken = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .is('used_at', null)
          .single()

        if (fetchError || !data) {
          setError("ACCESS TOKEN INVALID OR EXPIRED. COORDINATE WITH SUPERADMIN.")
          setLoading(false)
          return
        }

        // Token is valid, redirect to signup with context
        router.push(`/auth/signup?token=${token}&email=${encodeURIComponent(data.email)}&role=${data.role}`)
      } catch (err) {
        setError("SYSTEM SYNCHRONIZATION FAILURE. RETRY LATER.")
        setLoading(false)
      }
    }

    verifyToken()
  }, [token, router, supabase])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px] animate-pulse" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg glass-card p-12 bg-white/5 border-white/10 flex flex-col items-center gap-8 text-center"
      >
        <div className="w-20 h-20 bg-white text-black rounded-[2rem] flex items-center justify-center border-4 border-white shadow-[0_0_50px_rgba(255,255,255,0.1)]">
          {error ? <AlertCircle size={40} /> : <Shield size={40} />}
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-heading font-black tracking-tighter uppercase italic text-white leading-none">
            {error ? "Breach <span class='text-red-500'>Detected.</span>" : "Nexus <span class='text-gradient'>Sync.</span>"}
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">
            Invitation Validation Strategy
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="animate-spin text-white/40" size={32} />
            <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Verifying Credentials...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col gap-6 py-4 w-full">
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-widest leading-loose">
              {error}
            </div>
            <button 
              onClick={() => window.location.href = "https://spineempire.com"}
              className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
            >
              Return to Site
            </button>
          </div>
        ) : null}

        <p className="text-[8px] font-black uppercase tracking-[0.6em] text-white/10 italic">
          SECURE ENCRYPTED NODE ACCESS • SPINE EMPIRE
        </p>
      </motion.div>
    </div>
  )
}
