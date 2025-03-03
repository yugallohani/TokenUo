import { Certificate, User, CERTIFICATE_TYPES } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Trophy } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface CertificateCardProps {
  certificate: Certificate;
  user: User;
}

export default function CertificateCard({ certificate, user }: CertificateCardProps) {
  const { toast } = useToast();
  const certificateTypeInfo = CERTIFICATE_TYPES[certificate.certificateType as keyof typeof CERTIFICATE_TYPES];

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/certificates/${certificate.id}/verify`);
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch affected queries
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      queryClient.setQueryData(["/api/user"], data.user);

      toast({
        title: "Certificate Verified",
        description: `${data.certificate.tokenValue} tokens have been awarded!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Card className="w-full">
      <CardHeader className="flex-row space-y-0 gap-4">
        <Avatar>
          <AvatarImage src={user.avatar || ""} />
          <AvatarFallback>{user.name[0]}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <span className="font-semibold">{user.name}</span>
            <time className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(certificate.createdAt), { addSuffix: true })}
            </time>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">earned a new certificate</span>
            {certificate.isVerified && (
              <div className="flex items-center gap-1 text-green-600">
                <Trophy className="h-4 w-4" />
                <span className="text-sm font-medium">
                  +{certificate.tokenValue} tokens rewarded!
                </span>
              </div>
            )}
          </div>
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
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">
              {certificate.issuer}
            </Badge>
            <Badge variant="outline" className="bg-primary/10">
              {certificateTypeInfo.label} ({certificateTypeInfo.value} tokens)
            </Badge>
            {certificate.isVerified ? (
              <Badge variant="default" className="bg-green-600">
                Verified
              </Badge>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-yellow-500">
                  Pending Verification
                </Badge>
                <Button
                  size="sm"
                  onClick={() => verifyMutation.mutate()}
                  disabled={verifyMutation.isPending}
                >
                  Verify Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}