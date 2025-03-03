import { Certificate, User } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface CertificateCardProps {
  certificate: Certificate;
  user: User;
}

export default function CertificateCard({ certificate, user }: CertificateCardProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex-row space-y-0 gap-4">
        <Avatar>
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{user.name}</span>
            <time className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(certificate.createdAt), { addSuffix: true })}
            </time>
          </div>
          <span className="text-sm text-muted-foreground">earned a new certificate</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative aspect-video rounded-lg overflow-hidden">
          <img
            src={certificate.imageUrl}
            alt={certificate.title}
            className="object-cover w-full h-full"
          />
        </div>
        <div className="space-y-2">
          <h3 className="font-semibold">{certificate.title}</h3>
          <p className="text-sm text-muted-foreground">{certificate.description}</p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {certificate.issuer}
            </Badge>
            {certificate.isVerified && (
              <Badge variant="default" className="bg-green-600">
                Verified (+{certificate.tokenValue} tokens)
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
