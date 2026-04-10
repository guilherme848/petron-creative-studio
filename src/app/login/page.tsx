"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Lock, Mail, AlertCircle, Sparkles } from "lucide-react";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);

    startTransition(async () => {
      const result = await loginAction(formData);
      if (result.success) {
        router.replace(redirectTo);
        router.refresh();
      } else {
        setError(result.error || "Erro ao fazer login");
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-orange-950/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo + Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Petron Creative Studio</h1>
          <p className="text-sm text-muted-foreground">
            Entre com sua conta do ERP Petron
          </p>
        </div>

        <Card className="rounded-2xl border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@petron.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isPending}
                    className="pl-9 h-10"
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isPending}
                    className="pl-9 h-10"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/5 p-2.5 text-xs">
                  <AlertCircle className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-500 leading-relaxed">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0"
                disabled={isPending || !email || !password}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-[11px] text-muted-foreground">
          Acesso liberado apenas para: Diretor, Gerente, Tráfego e CS.
        </p>
      </div>
    </div>
  );
}
