"use client";

import { MessageSquare, Plus, Search, MoreHorizontal, Send, Paperclip } from "lucide-react";

export default function DiscussionsPage() {
    const chats = [
        { id: 1, name: "General Stack", lastMsg: "Bagaimana progress API?", time: "10:30", count: 2 },
        { id: 2, name: "Design Feedback", lastMsg: "Logo baru terlihat keren!", time: "09:12", count: 0 },
        { id: 3, name: "Backend Ops", lastMsg: "Server sudah dideploy.", time: "Kemarin", count: 0 },
    ];

    return (
        <div className="h-[calc(100vh-180px)] flex border border-border/60 rounded-lg bg-white overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Chat List */}
            <div className="w-[350px] border-r border-border/60 flex flex-col bg-muted/50">
                <div className="p-6 border-b border-border/60 space-y-4 text-foreground">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xl tracking-tight">Diskusi</h3>
                        <button className="p-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Cari obrolan..."
                            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-border/60 rounded-lg focus:outline-none focus:border-primary/40"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map((chat) => (
                        <div key={chat.id} className={`p-5 flex items-center justify-between hover:bg-white border-b border-border/60 cursor-pointer transition-colors ${chat.id === 1 ? 'bg-white border-l-4 border-l-primary' : ''}`}>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-lg bg-muted border border-border/60 flex items-center justify-center font-bold text-muted-foreground">
                                    {chat.name[0]}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-bold text-foreground truncate">{chat.name}</h4>
                                    <p className="text-xs text-muted-foreground font-medium truncate">{chat.lastMsg}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-muted-foreground mb-1 block">{chat.time}</span>
                                {chat.count > 0 && (
                                    <span className="bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                                        {chat.count}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="p-6 border-b border-border/60 flex items-center justify-between bg-white text-foreground">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-white font-bold">
                            G
                        </div>
                        <div>
                            <h3 className="font-bold text-base">General Stack</h3>
                            <p className="text-xs font-bold text-emerald-500">4 Anggota Online</p>
                        </div>
                    </div>
                    <button className="text-muted-foreground hover:text-foreground">
                        <MoreHorizontal size={20} />
                    </button>
                </div>

                <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-muted/50">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-lg bg-muted flex-shrink-0 flex items-center justify-center text-[10px] font-bold">S</div>
                        <div className="bg-white border border-border/60 p-4 rounded-lg rounded-tl-none max-w-md shadow-sm">
                            <p className="text-sm text-foreground font-medium leading-relaxed">Halo semuanya, ada yang bisa bantu cek API gateway? Sepertinya ada sedikit kendala di auth.</p>
                            <span className="text-[10px] font-bold text-muted-foreground mt-2 block">10:30 AM</span>
                        </div>
                    </div>
                    <div className="flex gap-4 flex-row-reverse">
                        <div className="w-8 h-8 rounded-lg bg-primary flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white">AD</div>
                        <div className="bg-primary text-white p-4 rounded-lg rounded-tr-none max-w-md shadow-lg shadow-black/10">
                            <p className="text-sm font-medium leading-relaxed">Siap Sarah, saya cek sekarang juga. Standby ya.</p>
                            <span className="text-[10px] font-bold text-primary mt-2 block">10:32 AM</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white border-t border-border/60">
                    <div className="flex items-center gap-4 bg-muted/50 border border-border/60 rounded-lg p-2 text-foreground">
                        <button className="p-2 text-muted-foreground hover:text-foreground"><Paperclip size={20} /></button>
                        <input
                            type="text"
                            placeholder="Ketik pesan..."
                            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium"
                        />
                        <button className="p-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors shadow-[0_8px_24px_rgba(217,166,64,0.25)]">
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
