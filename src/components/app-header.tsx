"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  "/": { title: "Dashboard", subtitle: "Visão geral" },
  "/clientes": { title: "Clientes", subtitle: "Gestão de marcas" },
  "/clientes/novo": { title: "Novo Cliente", subtitle: "Cadastrar marca" },
  "/produtos": { title: "Produtos", subtitle: "Banco de produtos" },
  "/produtos/novo": { title: "Novo Produto", subtitle: "Adicionar produto" },
  "/biblioteca": { title: "Biblioteca", subtitle: "Criativos gerados" },
  "/criar": { title: "Criar Criativo", subtitle: "Gerar anúncio" },
};

export function AppHeader() {
  const pathname = usePathname();
  const page = pageTitles[pathname] || {
    title: "Petron Creative Studio",
    subtitle: undefined,
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
        <Avatar className="h-7 w-7 border border-border cursor-pointer hover:border-orange-500/50">
          <AvatarFallback className="bg-gradient-to-br from-orange-500/20 to-rose-500/20 text-orange-400 text-[10px] font-semibold">
            GR
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
