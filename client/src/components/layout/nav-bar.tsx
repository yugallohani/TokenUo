import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  LayoutDashboard,
  LogOut,
  UserCircle,
  Home,
  ChartBar,
  BookOpen,
  Menu,
  X,
  GraduationCap,
  BarChart
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

export default function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close mobile menu when location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  if (!user) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Feed", showMobile: true },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", showMobile: true },
    { href: "/courses", icon: BookOpen, label: "Courses", showMobile: true, isNew: true },
    { href: "/analytics", icon: BarChart, label: "Analytics", showMobile: true, adminOnly: true },
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard", showMobile: true },
    { href: "/profile", icon: UserCircle, label: "Profile", showMobile: true },
  ];

  // Filter items for admin-only
  const filteredNavItems = navItems.filter(item => !item.adminOnly || user.isAdmin);

  const handleNavigate = (href: string) => {
    navigate(href);
    setMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container flex h-16 items-center px-4">
        <div className="mr-4 md:mr-8 flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold hidden sm:inline">TokenUp</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1 flex-1">
          {filteredNavItems.map(({ href, icon: Icon, label, isNew }) => (
            <Button
              key={href}
              variant="ghost"
              className={`flex items-center gap-2 relative ${
                location === href
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              onClick={() => handleNavigate(href)}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
              {isNew && (
                <Badge 
                  variant="outline" 
                  className="absolute -top-2 -right-2 px-1 py-0 h-4 min-w-4 text-[10px] bg-primary text-white border-0"
                >
                  New
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden flex-1 justify-end">
          <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* User actions (desktop) */}
        <div className="hidden md:flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                <span className="font-medium">{user.totalTokens} Tokens</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleNavigate("/profile")}>
                <UserCircle className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              {user.isAdmin && (
                <DropdownMenuItem onClick={() => handleNavigate("/analytics")}>
                  <BarChart className="h-4 w-4 mr-2" />
                  Analytics
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-[80%] sm:w-[300px] p-0">
            <SheetHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  TokenUp
                </SheetTitle>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>
            <div className="py-4">
              <div className="px-4 py-2 mb-2 border-b">
                <div className="flex items-center gap-2 mb-1">
                  <UserCircle className="h-5 w-5 text-primary" />
                  <span className="font-medium">{user.name}</span>
                  {user.isAdmin && (
                    <Badge variant="outline" className="ml-auto text-xs bg-primary/10 text-primary border-0">
                      Admin
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span>{user.totalTokens} Tokens</span>
                </div>
              </div>
              <div className="space-y-1 p-2">
                {filteredNavItems.filter(item => item.showMobile).map(({ href, icon: Icon, label, isNew }) => (
                  <Button
                    key={href}
                    variant="ghost"
                    className={`w-full justify-start relative ${
                      location === href
                        ? "bg-muted"
                        : ""
                    }`}
                    onClick={() => handleNavigate(href)}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {label}
                    {isNew && (
                      <Badge className="ml-auto bg-primary text-[10px] text-white">
                        New
                      </Badge>
                    )}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive mt-4"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}