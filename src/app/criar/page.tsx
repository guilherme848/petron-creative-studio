"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ImagePlus,
  ArrowRight,
  Users,
  Package,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

const prerequisites = [
  {
    title: "Cadastrar Cliente",
    description: "Logo e identidade visual",
    href: "/clientes/novo",
    icon: Users,
    color: "text-orange-400",
    borderColor: "border-orange-500/20",
    bg: "bg-orange-500/5",
  },
  {
    title: "Cadastrar Produto",
    description: "Fotos do produto",
    href: "/produtos/novo",
    icon: Package,
    color: "text-teal-400",
    borderColor: "border-teal-500/20",
    bg: "bg-teal-500/5",
  },
];

export default function CriarPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Criar Criativo</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gere criativos profissionais em poucos cliques.
        </p>
      </div>

      <Card className="border-border/50 bg-card/30 overflow-hidden rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl animate-glow-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-rose-500/5 animate-float">
              <ImagePlus className="h-9 w-9 text-orange-400/70" />
            </div>
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquare className="h-4 w-4 text-orange-400" />
            <h3 className="text-lg font-semibold">Pronto para criar</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
            Para gerar um criativo, você precisa ter pelo menos um cliente e um
            produto cadastrados. Complete os passos abaixo.
          </p>

          <div className="grid gap-3 sm:grid-cols-2 w-full max-w-md">
            {prerequisites.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="group cursor-pointer border-border/50 bg-card/50 hover:bg-card/80 hover:border-border hover:shadow-lg hover:-translate-y-0.5 h-full rounded-2xl">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.bg} border ${item.borderColor}`}>
                      <item.icon className={`h-4.5 w-4.5 ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-foreground">
                        {item.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
