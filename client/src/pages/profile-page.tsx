import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Certificate } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import ProfileCard from "@/components/profile/profile-card";
import CertificateCard from "@/components/certificates/certificate-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CERTIFICATE_TYPES } from "@shared/schema";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", user?.id],
    queryFn: () =>
      fetch(`/api/certificates?userId=${user?.id}`).then((r) => r.json()),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!certificates) return null;

  const handleCertificateUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      await apiRequest("POST", "/api/certificates", {
        title: formData.get("title"),
        issuer: formData.get("issuer"),
        imageUrl: formData.get("imageUrl"),
        description: formData.get("description"),
        certificateType: formData.get("certificateType"),
      });

      toast({
        title: "Success",
        description: "Certificate uploaded successfully",
      });

      (e.target as HTMLFormElement).reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload certificate",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="grid gap-8 md:grid-cols-[300px,1fr]">
        <div className="space-y-6">
          <ProfileCard user={user!} />

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Upload Certificate</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCertificateUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issuer">Issuer</Label>
                  <Input id="issuer" name="issuer" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificateType">Certificate Type</Label>
                  <Select name="certificateType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select certificate type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CERTIFICATE_TYPES).map(([key, { label, value }]) => (
                        <SelectItem key={key} value={key}>
                          {label} ({value} tokens)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Certificate Image URL</Label>
                  <Input id="imageUrl" name="imageUrl" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" required />
                </div>

                <Button type="submit" className="w-full">
                  Upload Certificate
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Your Certificates</h2>
          {certificates.map((cert) => (
            <CertificateCard key={cert.id} certificate={cert} user={user!} />
          ))}
        </div>
      </div>
    </div>
  );
}