import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { getAuthUserOrNull } from "@/lib/auth";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Petron Creative Studio",
  description: "Geração automática de criativos para Meta Ads",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const authUser = await getAuthUserOrNull();

  // Props serializáveis pros client components
  const userProps = authUser
    ? {
        name: authUser.name,
        email: authUser.email,
        avatarUrl: authUser.avatarUrl,
        role: authUser.creativeRole,
        isAdmin: authUser.isAdmin,
      }
    : null;

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider>
            {userProps ? (
              // Logado: layout completo com sidebar + header
              <SidebarProvider>
                <div className="flex min-h-screen w-full">
                  <AppSidebar user={userProps} />
                  <div className="flex flex-1 flex-col">
                    <AppHeader user={userProps} />
                    <main className="flex-1 overflow-y-auto custom-scrollbar">
                      <div className="mx-auto max-w-7xl px-6 py-8">
                        {children}
                      </div>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            ) : (
              // Não logado: /login ou erro — renderiza só children, sem chrome
              <>{children}</>
            )}
          </TooltipProvider>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
