import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Loader2 } from "lucide-react";
import { Link } from "wouter";

const TROPHY_COLORS = {
  1: "text-yellow-500",
  2: "text-gray-400",
  3: "text-amber-600",
};

export default function LeaderboardPage() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!users) return null;

  return (
    <div className="container py-8 fade-in">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-8 slide-in">
          <Trophy className="h-8 w-8 text-primary animate-bounce" />
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>

        <div className="space-y-4">
          {users.map((user, index) => (
            <div 
              key={user.id} 
              className="slide-in" 
              style={{ 
                animationDelay: `${index * 0.1}s` 
              }}
            >
              <Link href="/profile">
                <a className="block">
                  <Card className="p-4 hover-lift transition-all duration-300 hover:bg-accent">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-center font-bold">
                        {index < 3 ? (
                          <Trophy
                            className={`h-6 w-6 mx-auto hover-scale ${
                              TROPHY_COLORS[index + 1 as keyof typeof TROPHY_COLORS]
                            }`}
                          />
                        ) : (
                          `#${index + 1}`
                        )}
                      </div>

                      <Avatar className="h-12 w-12 hover-scale">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-muted-foreground">
                          @{user.username}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        <span className="font-bold">{user.totalTokens}</span>
                        <span className="text-muted-foreground">Tokens</span>
                      </div>
                    </div>
                  </Card>
                </a>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}