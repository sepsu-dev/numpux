"use client";

import { Users, Plus, Search, MoreHorizontal, Mail, Phone, MapPin } from "lucide-react";

export default function TeamPage() {
    const members = [
        { id: 1, name: "Sarah Johnson", role: "UI/UX Designer", email: "sarah@numpux.com", status: "Online" },
        { id: 2, name: "Budi Santoso", role: "Backend Developer", email: "budi@numpux.com", status: "Busy" },
        { id: 3, name: "Ani Wijaya", role: "Product Manager", email: "ani@numpux.com", status: "Offline" },
        { id: 4, name: "Deni Rahma", role: "Frontend Developer", email: "deni@numpux.com", status: "Online" },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tighter">Anggota Tim</h2>
                    <p className="text-muted-foreground font-medium mt-1">Kelola kolaborasi dan izin tim Anda.</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary hover:shadow-none shadow-[0_8px_24px_rgba(217,166,64,0.25)] transition-all">
                    <Plus size={18} />
                    Undang Anggota
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {members.map((member) => (
                    <div key={member.id} className="bg-white border border-border/60 p-6 rounded-lg shadow-sm flex items-center justify-between group hover:border-primary transition-all">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-lg bg-muted border border-border/60 flex items-center justify-center text-xl font-bold text-muted-foreground">
                                    {member.name[0]}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${member.status === 'Online' ? 'bg-emerald-500' :
                                        member.status === 'Busy' ? 'bg-red-500' : 'bg-muted'
                                    }`}></div>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">{member.name}</h3>
                                <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">{member.role}</p>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <Mail size={14} />
                                    <span className="text-[11px] font-medium">{member.email}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                                <MoreHorizontal size={20} />
                            </button>
                            <button className="px-3 py-1.5 text-[10px] font-bold uppercase text-primary border border-primary/20 rounded-lg hover:bg-primary hover:text-white transition-all">
                                Profil
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
