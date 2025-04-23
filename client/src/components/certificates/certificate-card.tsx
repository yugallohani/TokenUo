import { Certificate, User, CERTIFICATE_TYPES } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow, format } from "date-fns";
import { Trophy, Heart, MessageCircle, Share2, Loader2, Download, FileDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

interface CertificateCardProps {
  certificate: Certificate;
  user: User;
}

interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  user: User;
}

export default function CertificateCard({ certificate, user }: CertificateCardProps) {
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);
  const certificateTypeInfo = CERTIFICATE_TYPES[certificate.certificateType as keyof typeof CERTIFICATE_TYPES];

  const { data: hasLiked } = useQuery<{ hasLiked: boolean }>({
    queryKey: [`/api/certificates/${certificate.id}/hasLiked`],
    enabled: certificate.likesCount > 0,
  });

  const { data: comments, isLoading: isLoadingComments } = useQuery<Comment[]>({
    queryKey: [`/api/certificates/${certificate.id}/comments`],
    enabled: showComments,
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/certificates/${certificate.id}/verify`);
      return res.json();
    },
    onSuccess: (data) => {
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

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (hasLiked?.hasLiked) {
        await apiRequest("DELETE", `/api/certificates/${certificate.id}/like`);
      } else {
        await apiRequest("POST", `/api/certificates/${certificate.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/certificates/${certificate.id}/hasLiked`] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/certificates/${certificate.id}/comments`, {
        content: newComment,
      });
      return res.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: [`/api/certificates/${certificate.id}/comments`] });
      queryClient.invalidateQueries({ queryKey: ["/api/certificates"] });
    },
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link Copied",
      description: "Certificate link has been copied to clipboard",
    });
  };
  
  const generatePDF = async () => {
    if (!certificateRef.current || !certificate.isVerified) return;
    
    try {
      setGeneratingPDF(true);
      
      // Create new PDF with A4 dimensions
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Create certificate template
      const certificateTemplate = document.createElement('div');
      certificateTemplate.style.width = '210mm';
      certificateTemplate.style.padding = '20mm';
      certificateTemplate.style.boxSizing = 'border-box';
      certificateTemplate.style.position = 'fixed';
      certificateTemplate.style.top = '0';
      certificateTemplate.style.left = '0';
      certificateTemplate.style.zIndex = '-1000';
      certificateTemplate.style.backgroundColor = 'white';
      certificateTemplate.style.fontFamily = 'Arial, sans-serif';
      
      // Title and header
      certificateTemplate.innerHTML = `
        <div style="text-align: center; margin-bottom: 15mm;">
          <h1 style="color: #6366F1; font-size: 24px; margin-bottom: 5mm;">TokenUp - Certificate Verification</h1>
          <hr style="border: 1px solid #E5E7EB; margin-bottom: 5mm;" />
          <h2 style="font-size: 20px; color: #111827;">${certificate.title}</h2>
          <p style="color: #6B7280; font-style: italic;">Issued by: ${certificate.issuer}</p>
        </div>
        
        <div style="margin-bottom: 15mm;">
          <img src="${certificate.imageUrl}" style="width: 100%; max-height: 100mm; object-fit: contain; border: 1px solid #E5E7EB; border-radius: 4px;" />
        </div>
        
        <div style="margin-bottom: 10mm;">
          <h3 style="font-size: 16px; margin-bottom: 3mm;">Certificate Details:</h3>
          <p style="margin-bottom: 2mm;"><strong>Certificate Type:</strong> ${certificateTypeInfo.label}</p>
          <p style="margin-bottom: 2mm;"><strong>Issued To:</strong> ${user.name}</p>
          <p style="margin-bottom: 2mm;"><strong>Issued On:</strong> ${format(new Date(certificate.createdAt), 'MMM dd, yyyy')}</p>
          <p style="margin-bottom: 2mm;"><strong>Verified On:</strong> ${format(new Date(), 'MMM dd, yyyy')}</p>
          ${certificate.description ? `<p style="margin-bottom: 2mm;"><strong>Description:</strong> ${certificate.description}</p>` : ''}
        </div>
        
        <div style="background-color: #F3F4F6; padding: 5mm; border-radius: 4px; margin-bottom: 10mm;">
          <h3 style="font-size: 16px; margin-bottom: 3mm; color: #059669;">Token Rewards:</h3>
          <p style="color: #059669; font-size: 18px; font-weight: bold;">
            ${certificate.tokenValue} tokens have been awarded for this achievement!
          </p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 2mm;">
            Keep up the great work and continue earning more tokens.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 10mm;">
          <p style="color: #6B7280; font-size: 12px;">
            This certificate has been verified by TokenUp - The token-based learning platform.
          </p>
          <p style="color: #6B7280; font-size: 12px;">
            Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm:ss')}
          </p>
        </div>
      `;
      
      document.body.appendChild(certificateTemplate);
      
      // Generate canvas from HTML
      const canvas = await html2canvas(certificateTemplate, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      // Add image to PDF
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
      
      // Cleanup
      document.body.removeChild(certificateTemplate);
      
      // Save the PDF
      pdf.save(`${user.name}_${certificate.title}_certificate.pdf`);
      
      toast({
        title: "Certificate Downloaded",
        description: "Your certificate PDF has been generated successfully!",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your certificate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingPDF(false);
    }
  };

  return (
    <Card className="w-full">
      <div ref={certificateRef}>
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
                  {user.isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => verifyMutation.mutate()}
                      disabled={verifyMutation.isPending}
                    >
                      Verify Now
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </div>

      <CardContent className="pt-0">
        <div className="flex items-center justify-between gap-4 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => likeMutation.mutate()}
              disabled={likeMutation.isPending}
            >
              <Heart
                className={`h-4 w-4 ${hasLiked?.hasLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              <span>{certificate.likesCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowComments(!showComments)}
            >
              <MessageCircle className="h-4 w-4" />
              <span>{certificate.commentsCount}</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>

          {certificate.isVerified && (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={generatePDF}
              disabled={generatingPDF}
            >
              {generatingPDF ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>Download Certificate</span>
                </>
              )}
            </Button>
          )}
        </div>

        {showComments && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex gap-2">
              <Input
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button
                onClick={() => commentMutation.mutate()}
                disabled={!newComment.trim() || commentMutation.isPending}
              >
                Post
              </Button>
            </div>

            {isLoadingComments ? (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.avatar || ""} />
                      <AvatarFallback>{comment.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted p-2 rounded-lg">
                        <div className="font-medium text-sm">{comment.user.name}</div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                      <time className="text-xs text-muted-foreground ml-2">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </time>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}