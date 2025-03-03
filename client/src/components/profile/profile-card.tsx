import { User } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Trophy } from "lucide-react";

interface ProfileCardProps {
  user: User;
  rank?: number;
}

export default function ProfileCard({ user, rank }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader className="relative">
        {rank && (
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <Trophy className="h-4 w-4 text-yellow-500" />
            <span className="font-medium">Rank #{rank}</span>
          </div>
        )}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="text-xl">{user.name[0]}</AvatarFallback>
          </Avatar>
          <div className="text-center">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="text-center">
        <div className="flex justify-center items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <span className="text-2xl font-bold">{user.totalTokens}</span>
          <span className="text-muted-foreground">Tokens</span>
        </div>
        {user.bio && (
          <p className="mt-4 text-sm text-muted-foreground">{user.bio}</p>
        )}
      </CardContent>
    </Card>
  );
}
