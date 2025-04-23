import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Certificate } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Camera, Shield, ShieldCheck, Trophy, FileDown } from "lucide-react";
import ProfileCard from "@/components/profile/profile-card";
import CertificateCard from "@/components/certificates/certificate-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CERTIFICATE_TYPES } from "@shared/schema";
import { useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certificateFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isCertificateUploading, setIsCertificateUploading] = useState(false);
  const [uploadedCertificateUrl, setUploadedCertificateUrl] = useState("");
  const [uploadedFileType, setUploadedFileType] = useState<string>("");
  const [adminInfo, setAdminInfo] = useState<{isAdmin: boolean, userId: number, username: string} | null>(null);

  // Admin status check
  useQuery({
    queryKey: ["/api/admin/check"],
    queryFn: () => fetch("/api/admin/check").then((r) => {
      if (!r.ok) throw new Error("Failed to check admin status");
      return r.json();
    }),
    onSuccess: (data: {isAdmin: boolean, userId: number, username: string}) => setAdminInfo(data),
    onError: () => setAdminInfo(null),
    retry: false,
  });

  const { data: certificates, isLoading } = useQuery<Certificate[]>({
    queryKey: ["/api/certificates", user?.id],
    queryFn: () =>
      fetch(`/api/certificates?userId=${user?.id}`).then((r) => r.json()),
  });

  // Profile photo upload mutation
  const profilePhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profile", file);
      
      const response = await fetch("/api/upload/profile", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload profile photo");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate user cache to refresh the avatar in the UI
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Profile photo uploaded successfully",
      });
      setIsUploading(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload profile photo",
        variant: "destructive",
      });
      setIsUploading(false);
    }
  });

  // Certificate image upload mutation
  const certificateImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("certificate", file);
      
      const response = await fetch("/api/upload/certificate", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload certificate image");
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setUploadedCertificateUrl(data.imageUrl);
      setUploadedFileType(data.fileType || "");
      toast({
        title: "Success",
        description: "Certificate file uploaded. Now fill in the details.",
      });
      setIsCertificateUploading(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload certificate image",
        variant: "destructive",
      });
      setIsCertificateUploading(false);
    }
  });

  // Certificate submission mutation
  const certificateSubmitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const certData = {
        title: formData.get("title"),
        issuer: formData.get("issuer"),
        imageUrl: uploadedCertificateUrl || formData.get("imageUrl"),
        description: formData.get("description"),
        certificateType: formData.get("certificateType"),
        fileType: uploadedFileType,
        isPdf: uploadedFileType === 'application/pdf',
      };
      
      return apiRequest("POST", "/api/certificates", certData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
      toast({
        title: "Success",
        description: "Certificate uploaded successfully",
      });
      setUploadedCertificateUrl("");
      setUploadedFileType("");
      
      // Reset form
      const form = document.getElementById("certificate-form") as HTMLFormElement;
      if (form) form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit certificate",
        variant: "destructive",
      });
    }
  });

  const handleProfilePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleCertificateImageUpload = () => {
    certificateFileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'certificate') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'profile') {
      // Profile photos can only be JPG or PNG
      if (!file.type.match(/image\/(jpeg|png)/)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG or PNG image for your profile photo",
          variant: "destructive",
        });
        return;
      }
      setIsUploading(true);
      profilePhotoMutation.mutate(file);
    } else {
      // Certificates can be JPG, PNG, or PDF
      if (!file.type.match(/image\/(jpeg|png)/) && file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPG, PNG image, or PDF document",
          variant: "destructive",
        });
        return;
      }
      setIsCertificateUploading(true);
      certificateImageMutation.mutate(file);
    }
  };

  const handleCertificateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    certificateSubmitMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!certificates) return null;

  return (
    <div className="container py-8 px-4 md:px-8">
      <div className="grid gap-8 lg:grid-cols-[320px,1fr] md:grid-cols-1">
        <div className="space-y-6">
          <Card className="relative overflow-hidden">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <Avatar className="h-24 w-24 cursor-pointer border-2 border-border">
                    <AvatarImage src={user?.avatar || ""} />
                    <AvatarFallback className="text-2xl">{user?.name[0]}</AvatarFallback>
                  </Avatar>
                  <div 
                    className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    onClick={handleProfilePhotoUpload}
                  >
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/jpeg, image/png" 
                  onChange={(e) => handleFileChange(e, 'profile')}
                />
                
                <div className="mt-4 text-center">
                  <h2 className="text-xl font-bold">{user?.name}</h2>
                  <p className="text-sm text-muted-foreground">@{user?.username}</p>
                  
                  <div className="mt-2 flex justify-center items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Trophy className="h-3 w-3 text-primary" />
                      <span>{user?.totalTokens} Tokens</span>
                    </Badge>
                    
                    {user?.isAdmin && (
                      <Badge className="bg-primary/20 text-primary border-0 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        <span>Admin</span>
                      </Badge>
                    )}
                  </div>
                </div>
                
                {isUploading && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Uploading photo...
                  </div>
                )}
              </div>
              
              {user?.bio && (
                <p className="mt-4 text-sm text-muted-foreground text-center">{user.bio}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Add New Certificate
              </CardTitle>
              <CardDescription>
                Upload your certificate and earn tokens after verification
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="upload">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="upload">Upload Image</TabsTrigger>
                  <TabsTrigger value="url">External URL</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upload" className="space-y-4">
                  <div className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={handleCertificateImageUpload}
                  >
                    {uploadedCertificateUrl ? (
                      <div className="flex flex-col items-center">
                        {uploadedCertificateUrl.endsWith('.pdf') || 
                         uploadedFileType === 'application/pdf' ? (
                          <div className="bg-white rounded-lg shadow-lg p-4 mb-4 w-full max-w-md">
                            <div className="flex items-center justify-center mb-2">
                              <FileDown className="h-12 w-12 text-primary" />
                            </div>
                            <div className="text-center">
                              <h4 className="font-semibold">Certificate.pdf</h4>
                              <p className="text-xs text-muted-foreground mb-1">PDF Document</p>
                              <a 
                                href={uploadedCertificateUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                              >
                                View PDF
                              </a>
                            </div>
                          </div>
                        ) : (
                          <img 
                            src={uploadedCertificateUrl} 
                            alt="Uploaded certificate" 
                            className="w-full max-h-40 object-contain mb-4"
                          />
                        )}
                        <Button size="sm" variant="outline" className="mt-2" onClick={handleCertificateImageUpload}>
                          Replace File
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload certificate image
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, or PDF format, max 5MB
                        </p>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={certificateFileInputRef} 
                    className="hidden" 
                    accept="image/jpeg, image/png, application/pdf" 
                    onChange={(e) => handleFileChange(e, 'certificate')}
                  />
                  
                  {isCertificateUploading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading certificate...
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="url">
                  <div className="space-y-2 mb-4">
                    <Label htmlFor="imageUrl">Certificate Image URL</Label>
                    <Input id="imageUrl" name="imageUrl" placeholder="https://example.com/my-certificate.jpg" />
                  </div>
                </TabsContent>
              </Tabs>
              
              <form id="certificate-form" onSubmit={handleCertificateSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Certificate Title</Label>
                  <Input id="title" name="title" required placeholder="e.g. Web Development Bootcamp" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issuer">Issuer Organization</Label>
                  <Input id="issuer" name="issuer" required placeholder="e.g. Udemy, Coursera, University" />
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
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input id="description" name="description" placeholder="Briefly describe what you learned" />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={certificateSubmitMutation.isPending || (uploadedCertificateUrl === "" && !document.getElementById("imageUrl"))}
                >
                  {certificateSubmitMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : "Submit Certificate"}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          {adminInfo?.isAdmin && (
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Admin Panel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-4">
                  As an admin, you can verify certificates and access the analytics dashboard.
                </p>
                <div className="flex flex-col space-y-2">
                  <Button variant="outline" className="justify-start" asChild>
                    <a href="/analytics">
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      View Analytics Dashboard
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h2 className="text-2xl font-semibold">Your Certificates</h2>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 border-primary/20">
                {certificates.filter(cert => cert.isVerified).length} Verified
              </Badge>
              <Badge variant="outline">
                {certificates.length} Total
              </Badge>
            </div>
          </div>
          
          {certificates.length === 0 ? (
            <Card className="bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center p-8">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Trophy className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium mb-1">No Certificates Yet</h3>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Upload your certificates to earn tokens and climb the leaderboard.
                </p>
              </CardContent>
            </Card>
          ) : (
            certificates.map((cert) => (
              <CertificateCard key={cert.id} certificate={cert} user={user!} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}