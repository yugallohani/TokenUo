import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Certificate } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import CertificateCard from "@/components/certificates/certificate-card";
import { Loader2, Award, Trophy, Medal } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", user?.id],
    queryFn: () => 
      fetch(`/api/certificates?userId=${user?.id}`).then(r => r.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!certificates) return null;

  const verifiedCerts = certificates.filter(cert => cert.isVerified);
  const totalTokens = verifiedCerts.reduce((sum, cert) => sum + cert.tokenValue, 0);
  const progressToNextReward = (totalTokens % 10) / 10 * 100;

  const stats = [
    {
      title: "Total Certificates",
      value: certificates.length,
      icon: Award,
    },
    {
      title: "Verified Certificates",
      value: verifiedCerts.length,
      icon: Medal,
    },
    {
      title: "Total Tokens",
      value: totalTokens,
      icon: Trophy,
    },
  ];

  return (
    <div className="container py-8">
      <div className="grid gap-8">
        <section>
          <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
          <div className="grid gap-6 md:grid-cols-3">
            {stats.map(({ title, value, icon: Icon }) => (
              <Card key={title}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle>Progress to Next Reward</CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progressToNextReward} className="h-2" />
              <p className="text-sm text-muted-foreground mt-2">
                {10 - (totalTokens % 10)} more tokens needed
              </p>
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Your Certificates</h2>
          <div className="grid gap-6">
            {certificates.map((cert) => (
              <CertificateCard 
                key={cert.id} 
                certificate={cert} 
                user={user!} 
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
