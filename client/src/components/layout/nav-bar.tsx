import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  LayoutDashboard,
  LogOut,
  UserCircle,
  Home,
} from "lucide-react";

export default function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Feed" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { href: "/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <nav className="border-b bg-card">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-8 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">TokenUp</span>
        </div>

        <div className="flex items-center space-x-4 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <a
                className={`flex items-center space-x-2 ${
                  location === href
                    ? "text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </a>
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium">
            {user.totalTokens} Tokens
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
