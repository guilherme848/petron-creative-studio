"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Users,
  Package,
  ImagePlus,
  LayoutDashboard,
  MessageSquare,
  Images,
  BarChart3,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface SidebarUser {
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  isAdmin: boolean;
}

const menuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Clientes",
    href: "/clientes",
    icon: Users,
  },
  {
    title: "Produtos",
    href: "/produtos",
    icon: Package,
  },
  {
    title: "Biblioteca",
    href: "/biblioteca",
    icon: Images,
  },
];

export function AppSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Sidebar className="border-r border-sidebar-border/50">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-5">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316] shadow-lg shadow-orange-500/25 group-hover:shadow-orange-500/40">
            <MessageSquare className="h-4.5 w-4.5 text-white" />
            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                Petron Creative
              </span>
              <Badge
                variant="secondary"
                className="h-4.5 px-1.5 text-[9px] font-semibold uppercase tracking-wider bg-orange-500/15 text-orange-400 border-0 hover:bg-orange-500/15"
              >
                Beta
              </Badge>
            </div>
            <span className="text-[11px] text-muted-foreground font-medium">
              Studio
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* CTA principal */}
        <div className="px-2 mb-4">
          <Link href="/criar">
            <button
              className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all btn-micro ${
                pathname === "/criar"
                  ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/30"
                  : "bg-gradient-to-r from-[#F97316] to-[#f43f5e] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/35"
              }`}
            >
              <ImagePlus className="h-4 w-4" />
              Criar Criativo
            </button>
          </Link>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
            Navegação
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      className={
                        isActive
                          ? "relative bg-orange-500/10 text-orange-400 shadow-[inset_0_0_0_1px_hsl(25_95%_53%_/_0.15)] hover:bg-orange-500/15 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:rounded-full before:bg-gradient-to-b before:from-[#F97316] before:to-[#f43f5e]"
                          : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                      }
                    >
                      <item.icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-orange-400" : ""
                        }`}
                      />
                      <span className="text-[13px] font-medium">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user.isAdmin && (
          <SidebarGroup className="mt-2">
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-1">
              Administração
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href="/admin" />}
                    isActive={pathname === "/admin"}
                    className={
                      pathname === "/admin"
                        ? "relative bg-orange-500/10 text-orange-400 shadow-[inset_0_0_0_1px_hsl(25_95%_53%_/_0.15)] hover:bg-orange-500/15 before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[2px] before:rounded-full before:bg-gradient-to-b before:from-[#F97316] before:to-[#f43f5e]"
                        : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/60"
                    }
                  >
                    <BarChart3
                      className={`h-4 w-4 shrink-0 ${pathname === "/admin" ? "text-orange-400" : ""}`}
                    />
                    <span className="text-[13px] font-medium">Admin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50 p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <Avatar className="h-8 w-8 border border-sidebar-border">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
            <AvatarFallback className="bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-orange-400 text-xs font-semibold">
              {initials || "PC"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xs font-semibold text-sidebar-foreground truncate">
              {user.name}
            </span>
            <span className="text-[10px] text-muted-foreground truncate capitalize">
              {user.role}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
