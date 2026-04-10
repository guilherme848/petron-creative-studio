"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogOut, Loader2, BarChart3 } from "lucide-react";
import Link from "next/link";
import { logoutAction } from "@/app/login/actions";

interface HeaderUser {
  name: string;
  email: string;
  avatarUrl: string | null;
  role: string;
  isAdmin: boolean;
}

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Visão geral" },
  "/clientes": { title: "Clientes", subtitle: "Gestão de marcas" },
  "/clientes/novo": { title: "Novo Cliente", subtitle: "Cadastrar marca" },
  "/produtos": { title: "Produtos", subtitle: "Banco de produtos" },
  "/produtos/novo": { title: "Novo Produto", subtitle: "Adicionar produto" },
  "/biblioteca": { title: "Biblioteca", subtitle: "Criativos gerados" },
  "/criar": { title: "Criar Criativo", subtitle: "Gerar anúncio" },
  "/admin": { title: "Admin", subtitle: "Analytics e uso" },
};

export function AppHeader({ user }: { user: HeaderUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const page = pageTitles[pathname] || {
    title: "Petron Creative Studio",
    subtitle: undefined,
  };
  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.refresh();
    });
  };

  return (
    <header className="flex h-[60px] items-center justify-between border-b border-border/50 px-4 bg-background/80 glass sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
        <Separator
          orientation="vertical"
          className="h-4 bg-border/50"
        />
        <div className="flex items-center gap-2">
          <h1 className="text-sm font-semibold text-foreground animate-fade-in">
            {page.title}
          </h1>
          {page.subtitle && (
            <>
              <span className="text-muted-foreground/40 text-xs">/</span>
              <span className="text-xs text-muted-foreground">
                {page.subtitle}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full hover:bg-accent/40 p-0.5 transition-colors"
            aria-label="Menu do usuário"
          >
            <Avatar className="h-7 w-7 border border-border hover:border-orange-500/50">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
              <AvatarFallback className="bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-orange-400 text-[10px] font-semibold">
                {initials || "??"}
              </AvatarFallback>
            </Avatar>
          </button>

          {menuOpen && (
            <>
              {/* Click outside overlay */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpen(false)}
              />
              {/* Dropdown */}
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border/60 bg-popover shadow-2xl z-50 overflow-hidden animate-fade-in">
                <div className="p-3 border-b border-border/40 flex items-center gap-3">
                  <Avatar className="h-10 w-10 border border-border">
                    {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                    <AvatarFallback className="bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-orange-400 text-xs font-bold">
                      {initials || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    <p className="text-[10px] text-orange-400 mt-0.5 uppercase tracking-wider font-medium">
                      {user.role}
                    </p>
                  </div>
                </div>

                <div className="p-1">
                  {user.isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent rounded-lg transition-colors"
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isPending}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <LogOut className="h-3.5 w-3.5" />
                    )}
                    Sair
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
