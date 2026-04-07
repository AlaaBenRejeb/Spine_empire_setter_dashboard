"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { consumeInvitationRpc, verifyInvitationRpc } from "@/lib/supabase/invitationRpc"
import { motion } from "framer-motion"
import { Mail, Lock, User, ChevronRight, Loader2, CheckCircle2 } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [inviteInfo, setInviteInfo] = useState<{ email: string; role: string } | null>(null)
  const [validatingInvite, setValidatingInvite] = useState(true)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    if (!token) {
      router.push('/')
      return
    }

    const verifyInvite = async () => {
      setValidatingInvite(true)
      const { data, error: verifyError } = await verifyInvitationRpc(supabase, token)

      const invite = Array.isArray(data) ? data[0] : data
      if (verifyError || !invite) {
        setError("ACCESS TOKEN INVALID OR EXPIRED. COORDINATE WITH SUPERADMIN.")
        setValidatingInvite(false)
        return
      }

      setInviteInfo({ email: invite.email, role: invite.role })
      setEmail(invite.email || "")
      setValidatingInvite(false)
    }

    verifyInvite()
  }, [token, router, supabase])


  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) {
      setError("INVITATION TOKEN MISSING.")
      return
    }

    if (!inviteInfo) {
      setError("INVITATION CONTEXT NOT VERIFIED.")
      return
    }

    if (password !== confirmPassword) {
      setError("PASSWORDS DO NOT MATCH.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Auth Signup
      const { data: authData, error: signupError } = await supabase.auth.signUp({
        email: inviteInfo.email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          }
        }
      })

      if (signupError) throw signupError

      if (authData.user) {
        // 2. Atomically consume invitation + assign secure role from DB invite record
        const { error: consumeError } = await consumeInvitationRpc(supabase, {
          token,
          userId: authData.user.id,
          firstName,
          lastName
        })

        if (consumeError) {
          throw consumeError
        }

        setSuccess(true)
        setTimeout(() => {
          router.push('/')
        }, 2000)
      }
    } catch (err: any) {
      setError(err.message || "Nexus Synchronization Failure.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center flex flex-col items-center gap-6"
        >
          <div className="w-24 h-24 bg-emerald-500 text-black rounded-[2rem] flex items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.2)]">
            <CheckCircle2 size={48} strokeWidth={3} />
          </div>
          <h1 className="text-5xl font-heading font-black tracking-tighter uppercase italic text-white leading-none">
            Node <span className="text-emerald-500">Active.</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">INITIALIZING EMPIRE ENVIRONMENT...</p>
        </motion.div>
      </div>
    )
  }

  if (validatingInvite) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
        <div className="text-center flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-white/40" size={32} />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">VALIDATING INVITATION TOKEN...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] animate-pulse delay-700" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg flex flex-col gap-12 relative z-10"
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 bg-white text-black rounded-[2rem] shadow-[0_0_50px_rgba(255,255,255,0.1)] flex items-center justify-center border-4 border-white">
            <User size={40} strokeWidth={3} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-7xl font-heading font-black tracking-tighter uppercase leading-none italic text-white text-gradient">
              Join <span className="text-white">Empire.</span>
            </h1>
            <p className="text-white/30 font-black text-[10px] tracking-[0.4em] uppercase italic">
              Deployment Access for {inviteInfo?.role === 'setter' ? 'Setter Node' : inviteInfo?.role} Authorization
            </p>
          </div>
        </div>

        <div className="glass-card p-12 flex flex-col gap-8 border-white/10 bg-white/5 shadow-[0_0_80px_rgba(255,255,255,0.02)]">
          <div className="flex flex-col gap-2 text-center pb-4">
             <h2 className="text-2xl font-heading font-black uppercase italic tracking-tighter leading-none text-white">Initialize Identity</h2>
             <p className="text-[10px] font-black uppercase tracking-widest text-white/30 italic">Step into the Command Environment</p>
          </div>

          <form onSubmit={handleSignup} className="flex flex-col gap-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-black uppercase tracking-widest italic text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="FIRST NAME" 
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 pl-16 pr-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all placeholder:text-white/10 text-white"
                />
              </div>
              <div className="relative group">
                <User className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="LAST NAME" 
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 pl-16 pr-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all placeholder:text-white/10 text-white"
                />
              </div>
            </div>

            <div className="relative group">
              <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="email" 
                placeholder="NEXUS IDENTITY (EMAIL)" 
                disabled
                value={email}
                onChange={() => undefined}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 pl-16 pr-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all placeholder:text-white/20 text-white"
              />
            </div>


            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="DEFINE ACCESS KEY" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 pl-16 pr-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all placeholder:text-white/10 text-white"
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="password" 
                placeholder="CONFIRM ACCESS KEY" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-2xl py-6 pl-16 pr-8 text-[12px] font-black tracking-widest uppercase focus:border-white focus:bg-white/10 outline-none transition-all placeholder:text-white/10 text-white"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:shadow-[0_0_50px_rgba(255,255,255,0.2)] active:scale-95 transition-all group disabled:opacity-30"
            >
              {loading ? "INITIALIZING NODE..." : "ACTIVATE NODE"} 
              <ChevronRight size={18} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
            </button>

            <p className="text-center text-[8px] font-black uppercase tracking-[0.6em] text-white/10 italic pb-2">ENCRYPTED IDENTITY REGISTRATION ACTIVE</p>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
