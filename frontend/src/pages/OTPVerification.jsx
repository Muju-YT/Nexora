import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw, Copy } from 'lucide-react';
import useAuthStore from '../store/authStore';
import CyberButton from '../components/CyberButton';
import GlowCard from '../components/GlowCard';

const OTPVerification = () => {
  const navigate = useNavigate();
  const { verifyOtp, resendOtp, loading, error, otpPreview } = useAuthStore();
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [resendMsg, setResendMsg] = useState('');
  const inputRefs = useRef([]);

  const handleDigitChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...digits];
    updated[index] = value;
    setDigits(updated);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length !== 6) return;
    const result = await verifyOtp(otp);
    if (result.success) {
      navigate('/');
    }
  };

  const handleResend = async () => {
    setResendMsg('');
    const result = await resendOtp();
    if (result.success) {
      setResendMsg(`New verification code sent! Dev preview: ${result.otp}`);
    }
  };

  const handleCopyOtp = () => {
    if (otpPreview) {
      navigator.clipboard.writeText(otpPreview);
      setDigits(otpPreview.split(''));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-obsidian">
      {/* Background glowing elements */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyber-pink/5 blur-[120px] -top-20 -right-20 animate-pulse" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyber-violet/5 blur-[120px] -bottom-20 -left-20 animate-pulse" />

      <motion.div
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-3">
            <ShieldCheck className="w-10 h-10 text-cyber-pink" />
          </div>
          <h1 className="text-5xl font-black italic tracking-tight select-none bg-gradient-to-r from-[#FCAF45] via-[#E1306C] to-[#C13584] bg-clip-text text-transparent">
            Nexora
          </h1>
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mt-3">Verify Your Account</p>
        </div>

        <GlowCard hoverable={false} className="p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <p className="text-xs text-slate-400 leading-relaxed text-center">
              Please enter the 6-digit confirmation code we sent to your email address.
            </p>

            {/* DEV OTP Preview Banner */}
            {otpPreview && (
              <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-cyber-emerald/10 border border-cyber-emerald/20">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-cyber-emerald uppercase tracking-widest">
                    Dev Mode OTP Preview
                  </span>
                  <span className="text-lg font-black text-white tracking-[0.4em] mt-0.5">
                    {otpPreview}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOtp}
                  className="flex items-center gap-1 text-[10px] font-bold text-cyber-emerald uppercase tracking-wider border border-cyber-emerald/30 rounded px-2 py-1 hover:bg-cyber-emerald/10 cursor-pointer"
                >
                  Auto-fill
                </button>
              </div>
            )}

            {error && (
              <div className="p-3.5 rounded-xl bg-cyber-pink/10 border border-cyber-pink/20 text-xs font-semibold text-cyber-pink tracking-wide">
                {error}
              </div>
            )}

            {resendMsg && (
              <div className="p-3.5 rounded-xl bg-cyber-violet/10 border border-cyber-violet/20 text-xs font-semibold text-cyber-violet tracking-wide">
                {resendMsg}
              </div>
            )}

            {/* OTP Input Grid */}
            <div className="flex justify-center gap-3.5" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-xl font-black rounded-xl border transition-all duration-150 bg-obsidian-card text-white outline-none
                    ${digit 
                      ? 'border-cyber-pink' 
                      : 'border-obsidian-border hover:border-slate-700'
                    }
                    focus:border-cyber-pink`}
                />
              ))}
            </div>

            <CyberButton 
              type="submit" 
              variant="pink" 
              className="w-full mt-2 py-3"
              disabled={loading || digits.join('').length !== 6}
            >
              {loading ? 'Verifying...' : 'Submit Code'}
            </CyberButton>

            <button 
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="flex items-center justify-center gap-2 text-xs font-bold text-center text-cyber-pink hover:underline uppercase cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" />
              Resend verification code
            </button>
          </form>
        </GlowCard>
      </motion.div>
    </div>
  );
};

export default OTPVerification;
