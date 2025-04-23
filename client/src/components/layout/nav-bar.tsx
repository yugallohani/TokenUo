import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  LayoutDashboard,
  LogOut,
  UserCircle,
  Home,
  ChartBar,
  ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function NavBar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [tokenAnimating, setTokenAnimating] = useState(false);

  useEffect(() => {
    // Initial animation when component mounts
    if (user?.totalTokens) {
      setTokenAnimating(true);
      const timer = setTimeout(() => setTokenAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    // Animate when token count changes
    if (user?.totalTokens) {
      setTokenAnimating(true);
      const timer = setTimeout(() => setTokenAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.totalTokens]);

  const makeAdmin = async () => {
    if (!user) return;
    
    try {
      const res = await apiRequest("POST", "/api/makeAdmin");
      if (res.ok) {
        const updatedUser = await res.json();
        queryClient.setQueryData(["/api/user"], updatedUser);
        toast({
          title: "Success!",
          description: "You are now an administrator",
        });
      } else {
        toast({
          title: "Failed",
          description: "Could not set admin status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  const navItems = [
    { href: "/", icon: Home, label: "Feed" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/analytics", icon: ChartBar, label: "Analytics" },
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard" },
    { href: "/profile", icon: UserCircle, label: "Profile" },
  ];

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="border-b bg-card sticky top-0 z-10 shadow-sm"
    >
      <div className="container flex h-16 items-center px-4">
        <motion.div 
          className="mr-8 flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Trophy className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-500 text-transparent bg-clip-text">TokenUp</span>
        </motion.div>

        <div className="flex items-center space-x-4 flex-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <div className="cursor-pointer">
                <motion.div 
                  className={`flex items-center space-x-2 ${
                    location === href
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  whileHover={{ y: -2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Icon className={`h-4 w-4 ${location === href ? "text-primary" : ""}`} />
                  <span>{label}</span>
                </motion.div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <motion.div
            animate={tokenAnimating ? { 
              scale: [1, 1.2, 1],
              color: ["#000000", "#7c3aed", "#000000"] 
            } : {}}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2"
          >
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">
              {user.totalTokens} Tokens
            </span>
          </motion.div>
          
          {user.isAdmin ? (
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={makeAdmin}
              className="text-xs"
            >
              Make Admin
            </Button>
          )}
          
          <motion.div whileHover={{ rotate: 20 }}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => logoutMutation.mutate()}
              className="text-muted-foreground hover:text-primary"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </div>
    </motion.nav>
  );
}