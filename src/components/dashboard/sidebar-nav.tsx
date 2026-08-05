"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import {
    LayoutDashboard,
    CheckSquare,
    Briefcase,
    Calendar,
    LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
    href: string;
    icon: any;
    label: string;
    count?: number;
}

const mainNav: NavItem[] = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Beranda" },
    { href: "/dashboard/tasks", icon: CheckSquare, label: "Tugas", count: 5 },
    { href: "/dashboard/projects", icon: Briefcase, label: "Proyek" },
];

const productivityNav: NavItem[] = [
    { href: "/dashboard/calendar", icon: Calendar, label: "Kalender" },
];

export function SidebarNav() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        toast.success("Berhasil keluar!");
        router.push("/login");
    };

    return (
        <>
            <SidebarHeader className="p-2 group-data-[collapsible=icon]:px-1.5 h-14 flex items-center border-b border-border bg-card">
                <Link href="/dashboard" className="flex items-center justify-start group-data-[collapsible=icon]:justify-center w-full h-9 px-1 group-data-[collapsible=icon]:p-0 rounded-xl">
                    <div className="w-9 h-9 flex items-center justify-center shrink-0">
                        <Image
                            src="/logo-v2.png"
                            alt="Numpux Logo"
                            width={28}
                            height={28}
                        />
                    </div>
                    <span className="font-bold text-sm tracking-tight text-foreground group-data-[collapsible=icon]:hidden ml-3 lowercase">numpux</span>
                </Link>
            </SidebarHeader>
 
            <SidebarContent className="py-4 px-2 group-data-[collapsible=icon]:px-0 space-y-2 bg-card">
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1 group-data-[collapsible=icon]:hidden">
                        Utama
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {mainNav.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                    tooltip={item.label}
                                    className={cn(
                                        "h-9 px-3 rounded-xl transition-colors",
                                        "group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center",
                                        pathname === item.href
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Link href={item.href} className="flex items-center w-full group-data-[collapsible=icon]:justify-center">
                                        <item.icon size={16} className={cn("shrink-0", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                                        <span className="ml-3 text-[13px] group-data-[collapsible=icon]:hidden">{item.label}</span>
                                        {item.count && (
                                            <span className={cn(
                                                "ml-auto text-[10px] px-2 py-0.5 rounded-full font-bold group-data-[collapsible=icon]:hidden",
                                                pathname === item.href ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                            )}>
                                                {item.count}
                                            </span>
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup>
                    <SidebarGroupLabel className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 mb-1 group-data-[collapsible=icon]:hidden">
                        Produktivitas
                    </SidebarGroupLabel>
                    <SidebarMenu>
                        {productivityNav.map((item) => (
                            <SidebarMenuItem key={item.href}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={pathname === item.href}
                                    tooltip={item.label}
                                    className={cn(
                                        "h-9 px-3 rounded-xl transition-colors",
                                        "group-data-[collapsible=icon]:!h-9 group-data-[collapsible=icon]:!w-9 group-data-[collapsible=icon]:!p-0 group-data-[collapsible=icon]:justify-center",
                                        pathname === item.href
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <Link href={item.href} className="flex items-center w-full group-data-[collapsible=icon]:justify-center">
                                        <item.icon size={16} className={cn("shrink-0", pathname === item.href ? "text-primary" : "text-muted-foreground")} />
                                        <span className="ml-3 text-[13px] group-data-[collapsible=icon]:hidden">{item.label}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-2 group-data-[collapsible=icon]:px-1.5 border-t border-border bg-card flex items-center justify-center">
                <button
                    onClick={handleLogout}
                    className="flex items-center justify-start group-data-[collapsible=icon]:justify-center w-full h-9 px-3 group-data-[collapsible=icon]:p-0 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors font-medium text-[13px] cursor-pointer"
                >
                    <LogOut size={16} className="shrink-0" />
                    <span className="ml-3 group-data-[collapsible=icon]:hidden">Keluar</span>
                </button>
            </SidebarFooter>
        </>
    );
}