import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Orbit, Rocket } from "lucide-react";
import {
  Menu, Home, Compass, PenSquare, LayoutDashboard, User, Settings, LogOut,
  Bell, Sun, Moon, Search, Sparkles, LogIn, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AiAssistant } from "@/components/AiAssistant";
import { useAuth } from "@/lib/auth";
import { usePresenceTracking } from "@/hooks/usePresence";

const publicNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const authNav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/post", label: "Post Dream", icon: PenSquare },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/account", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const { loggedIn, login, logout } = useAuth();
  usePresenceTracking();
  const navItems = loggedIn ? authNav : publicNav;
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const path = useRouterState({ select: (s) => s.location.pathname });
  const showSearch = path === "/" || path === "/explore";

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("light", next === "light");
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground gradient-cosmic overflow-x-clip">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen z-40 w-64 bg-surface border-r border-border/60 transform transition-transform ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        <div className="h-16 flex items-center gap-2 px-5 border-b border-border/60">
          <div className="h-9 w-9 rounded-xl gradient-violet grid place-items-center glow-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <Link to="/" className="font-display text-xl tracking-tight">Velara</Link>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = path === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  active
                    ? "bg-primary/15 text-foreground border border-primary/30"
                    : "text-muted-foreground hover:bg-card hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="pt-3 mt-3 border-t border-border/60">
            {loggedIn ? (
              <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-card hover:text-foreground">
                <LogOut className="h-4 w-4" /> Log out
              </button>
            ) : (
              <Link to="/auth" onClick={() => setOpen(false)} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm gradient-violet text-primary-foreground glow-primary">
                <LogIn className="h-4 w-4" /> Log in / Sign up
              </Link>
            )}
          </div>
        </nav>
        <div className="absolute bottom-4 left-4 right-4 rounded-xl p-4 bg-card/60 border border-border/60">
          <p className="text-xs text-muted-foreground">Tonight's prompt</p>
          <p className="text-sm mt-1">Did anything feel familiar?</p>
        </div>
      </aside>

      {open && <button aria-label="Close menu" onClick={() => setOpen(false)} className="lg:hidden fixed inset-0 bg-background/70 backdrop-blur-sm z-30" />}

      {/* Main */}
      <div className="flex-1 min-w-0 max-w-full flex flex-col overflow-x-clip">
        <header className="sticky top-0 z-20 bg-surface/80 backdrop-blur border-b border-border/60 px-3 sm:px-4 lg:px-8 py-3 sm:py-4 flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></Button>
          {/*<Button asChild variant="ghost" size="icon" aria-label="Messages" className="rounded-full bg-primary/15 text-accent hover:bg-primary/25 shrink-0">
            <Link to="/chat" search={{ tab: undefined }}><MessageCircle className="h-5 w-5" /></Link>
          </Button>*/}
          {loggedIn && (
  <Button
    asChild
    variant="ghost"
    size="icon"
    aria-label="Messages"
    className="rounded-full bg-primary/15 text-accent hover:bg-primary/25 shrink-0"
  >
    <Link to="/chat" search={{ tab: undefined }}>
      <MessageCircle className="h-5 w-5" />
    </Link>
  </Button>
)}
          <div className="flex-1 text-center min-w-0">
            <Link to="/" className="font-display text-2xl sm:text-4xl lg:text-6xl tracking-tight bg-gradient-to-r from-primary via-accent to-prophetic bg-clip-text text-transparent drop-shadow-[0_0_25px_oklch(0.65_0.16_50/0.35)]">
              Velara
            </Link>
            <p className="text-[10px] text-muted-foreground mt-1 tracking-[0.3em] uppercase hidden md:block">a gentle place for dreams</p>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            {/*<Button asChild variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Link to="/notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-nightmare" />
              </Link>
            </Button>*/}
            {loggedIn && (
  <Button
    asChild
    variant="ghost"
    size="icon"
    className="relative"
    aria-label="Notifications"
  >
    <Link to="/notifications">
      <Bell className="h-5 w-5" />
      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-nightmare" />
    </Link>
  </Button>
)}
          </div>
        </header>
        <main className={`flex-1 px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10 ${showSearch ? "pb-28" : "pb-10"}`}>{children}</main>
        {showSearch && (
          <div className="sticky bottom-0 z-20 bg-surface/90 backdrop-blur border-t border-border/60 px-3 sm:px-4 lg:px-8 py-3">
            <Link to="/search" className="block max-w-2xl mx-auto relative">
              <Search className="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              <Input readOnly placeholder="Search dreams, themes, symbols…" className="pl-11 h-11 rounded-full bg-card border-border/60 cursor-pointer" />
            </Link>
          </div>
        )}
        <footer className="px-3 sm:px-4 lg:px-8 py-4 border-t border-border/60 text-xs text-muted-foreground flex flex-wrap gap-3 justify-between items-center">

  <span>🌙 Velara — a universe of hidden dreams</span>

  <span className="flex items-center gap-2">
    <Orbit className="h-3 w-3 text-accent" />
    lucid nights • cosmic thoughts
    <Rocket  className="h-3.5 w-3.5 text-fuchsia-400" />
  </span>

</footer>
      </div>
      <AiAssistant />
    </div>
  );
}
