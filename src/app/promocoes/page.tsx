"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Megaphone, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function PromocoesPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Promoções</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Configure promoções e gere selos 3D com IA.
          </p>
        </div>
        <Link href="/promocoes/nova">
          <Button className="bg-gradient-to-r from-[#F97316] to-[#f43f5e] hover:from-[#ea6c10] hover:to-[#e0354f] text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 border-0 btn-micro">
            <Plus className="mr-2 h-4 w-4" />
            Nova Promoção
          </Button>
        </Link>
      </div>

      <Card className="border-border/50 bg-card/30 overflow-hidden rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-20">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl animate-glow-pulse" />
            <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/5 animate-float">
              <Megaphone className="h-9 w-9 text-amber-400/70" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-1.5">Nenhuma promoção cadastrada</h3>
          <p className="text-sm text-muted-foreground mb-6 text-center max-w-sm">
            Crie sua primeira promoção para começar a gerar criativos com selos 3D gerados por inteligência artificial.
          </p>
          <Link href="/promocoes/nova">
            <Button
              variant="outline"
              className="border-border/50 hover:border-orange-500/30 hover:bg-orange-500/5 group btn-micro"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Promoção
              <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
