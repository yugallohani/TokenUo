import { useQuery } from "@tanstack/react-query";
import CertificateCard from "@/components/certificates/certificate-card";
import { Loader2 } from "lucide-react";
import type { Certificate, User } from "@shared/schema";

export default function HomePage() {
  const { data: certificates, isLoading: isLoadingCerts } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates"],
  });

  const { data: users, isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/leaderboard"],
  });

  if (isLoadingCerts || isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!certificates || !users) return null;

  const getUserById = (userId: number) => users.find((u) => u.id === userId);

  return (
    <div className="container py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Activity Feed</h1>
        {certificates
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map((cert) => {
            const user = getUserById(cert.userId);
            if (!user) return null;
            return (
              <CertificateCard 
                key={cert.id} 
                certificate={cert} 
                user={user} 
              />
            );
          })}
      </div>
    </div>
  );
}
