import React, { useState } from 'react';
import { ArrowLeft, Users, ShieldAlert, BarChart3, CheckSquare, XSquare } from 'lucide-react';
import GlowCard from '../components/GlowCard';

const AdminDashboard = () => {
  const [reports, setReports] = useState([
    { id: 101, reporter: "neon_aurora", reported: "spam_bot_01", reason: "Spam advertising token links in timeline comments.", status: "pending", content_type: "comment" },
    { id: 102, reporter: "cyber_pioneer", reported: "toxic_user_44", reason: "Abusive/toxic responses inside poll cast panels.", status: "pending", content_type: "poll" }
  ]);

  const [actionsLog, setActionsLog] = useState([
    { id: 1, admin: "staff_moderator", action: "SUSPEND_USER", target: "spammer_99", time: "1h ago" },
    { id: 2, admin: "staff_moderator", action: "DELETE_POST", target: "Post #2401", time: "3h ago" }
  ]);

  const handleResolve = (id, resolution) => {
    // simulated moderation
    alert(`Report #${id} resolved as: ${resolution}`);
    setReports(reports.filter(r => r.id !== id));
    setActionsLog([
      { id: Date.now(), admin: "staff_moderator", action: resolution.toUpperCase(), target: `Report #${id}`, time: "Just now" },
      ...actionsLog
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col gap-6">
      
      {/* Top dashboard header cockpit */}
      <div className="flex justify-between items-center bg-obsidian-card/45 p-4 rounded-xl border border-white/5">
        <div>
          <h2 className="text-2xl font-black text-white">ADMIN GRID COCKPIT</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Platform moderation & analytical status</p>
        </div>
        <span className="text-[10px] font-black text-cyber-violet bg-cyber-violet/10 border border-cyber-violet/20 px-3 py-1.5 rounded uppercase tracking-wider">
          Root Staff Active
        </span>
      </div>

      {/* Numerical Analytical Trend lines */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard hoverable={false} className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active Nodes</span>
            <span className="text-2xl font-black text-white">1,420</span>
          </div>
          <div className="p-2.5 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan">
            <Users className="w-5 h-5" />
          </div>
        </GlowCard>

        <GlowCard hoverable={false} className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pending Violations</span>
            <span className="text-2xl font-black text-white">{reports.length}</span>
          </div>
          <div className="p-2.5 rounded-full bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </GlowCard>

        <GlowCard hoverable={false} className="p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">System Decryption health</span>
            <span className="text-2xl font-black text-white">99.85%</span>
          </div>
          <div className="p-2.5 rounded-full bg-cyber-violet/10 border border-cyber-violet/20 text-cyber-violet">
            <BarChart3 className="w-5 h-5" />
          </div>
        </GlowCard>
      </div>

      {/* Main Moderation Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: Pending Reports */}
        <div className="lg:col-span-2 flex flex-col gap-3.5">
          <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Pending Incident Reports</span>
          
          {reports.length > 0 ? (
            reports.map((report) => (
              <GlowCard key={report.id} hoverable={false} className="p-5 flex flex-col gap-4 border-l-2 border-l-cyber-pink">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-black text-white">Incident Report #{report.id}</span>
                    <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                      Filed by {report.reporter} on user {report.reported}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-cyber-pink bg-cyber-pink/10 border border-cyber-pink/20 px-2 py-0.5 rounded uppercase">
                    Type: {report.content_type}
                  </span>
                </div>
                
                <p className="text-xs text-slate-400 bg-obsidian p-3 rounded border border-white/5 leading-relaxed">
                  Reason: {report.reason}
                </p>

                {/* Moderate resolution buttons */}
                <div className="flex gap-3 justify-end mt-2">
                  <button 
                    onClick={() => handleResolve(report.id, "dismiss")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-white/5 bg-obsidian hover:bg-white/5 text-[10px] font-black uppercase text-slate-400 hover:text-white"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Dismiss Report
                  </button>
                  <button 
                    onClick={() => handleResolve(report.id, "suspend")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyber-pink/30 bg-cyber-pink/10 hover:bg-cyber-pink/20 text-[10px] font-black uppercase text-cyber-pink"
                  >
                    <XSquare className="w-3.5 h-3.5" /> Suspend Account
                  </button>
                </div>
              </GlowCard>
            ))
          ) : (
            <div className="text-center py-12 border border-dashed border-white/5 rounded-xl bg-obsidian-card/25 text-xs text-slate-500">
              Zero pending incidents on the timeline queue.
            </div>
          )}
        </div>

        {/* Right Columns: Admin Audit Log */}
        <div className="flex flex-col gap-3.5">
          <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Admin Audit Log</span>
          
          <GlowCard hoverable={false} className="p-4 flex flex-col gap-4">
            {actionsLog.map((log) => (
              <div key={log.id} className="flex justify-between items-start text-[11px] pb-3 border-b border-white/5 last:border-0 last:pb-0">
                <div className="flex flex-col gap-0.5">
                  <span className="font-bold text-white uppercase tracking-wider">{log.action}</span>
                  <span className="text-slate-400">{log.target}</span>
                  <span className="text-[8px] text-slate-600 mt-1 uppercase font-semibold">By {log.admin}</span>
                </div>
                <span className="text-slate-500 font-bold">{log.time}</span>
              </div>
            ))}
          </GlowCard>
        </div>

      </div>

    </div>
  );
};

export default AdminDashboard;
