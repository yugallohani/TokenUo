import { Certificate, User, CERTIFICATE_TYPES } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { Trophy, Heart, MessageCircle, Share2, Loader2, CheckCircle, Shield } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="w-full overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex-row space-y-0 gap-4">
          <motion.div whileHover={{ scale: 1.1 }} transition={{ type: "spring", stiffness: 400, damping: 17 }}>
            <Avatar>
              <AvatarImage src={user.avatar || ""} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
          </motion.div>
          <div className="flex flex-col flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{user.name}</span>
              <time className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(certificate.createdAt), { addSuffix: true })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">earned a new certificate</span>
              <AnimatePresence>
                {certificate.isVerified && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-1 text-green-600"
                  >
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      +{certificate.tokenValue} tokens rewarded!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div 
            className="relative aspect-video rounded-lg overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={certificate.imageUrl}
              alt={certificate.title}
              className="object-cover w-full h-full"
            />
            {certificate.isVerified && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg"
              >
                <CheckCircle className="h-5 w-5 text-white" />
              </motion.div>
            )}
          </motion.div>
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{certificate.title}</h3>
            <p className="text-sm text-muted-foreground">{certificate.description}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <motion.div whileHover={{ scale: 1.05 }}>
                <Badge variant="outline">
                  {certificate.issuer}
                </Badge>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }}>
                <Badge variant="outline" className="bg-primary/10">
                  {certificateTypeInfo.label} ({certificateTypeInfo.value} tokens)
                </Badge>
              </motion.div>
              
              {certificate.isVerified ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Badge variant="default" className="bg-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                </motion.div>
              ) : (
                <div className="flex items-center gap-2">
                  <motion.div whileHover={{ scale: 1.05 }}>
                    <Badge variant="default" className="bg-yellow-500">
                      Pending Verification
                    </Badge>
                  </motion.div>
                  
                  {user.isAdmin && (
                    <motion.div 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        size="sm"
                        onClick={() => verifyMutation.mutate()}
                        disabled={verifyMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                      >
                        {verifyMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Shield className="h-3 w-3" />
                        )}
                        Verify Now
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-2 border-t">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => likeMutation.mutate()}
                disabled={likeMutation.isPending}
              >
                <motion.div
                  animate={hasLiked?.hasLiked ? { 
                    scale: [1, 1.3, 1],
                  } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <Heart
                    className={`h-4 w-4 ${hasLiked?.hasLiked ? "fill-red-500 text-red-500" : ""}`}
                  />
                </motion.div>
                <span>{certificate.likesCount}</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setShowComments(!showComments)}
              >
                <MessageCircle className="h-4 w-4" />
                <span>{certificate.commentsCount}</span>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </Button>
            </motion.div>
          </div>

          <AnimatePresence>
            {showComments && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4 pt-4 border-t overflow-hidden"
              >
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
                    {commentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : null}
                    Post
                  </Button>
                </div>

                {isLoadingComments ? (
                  <div className="flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments?.map((comment, index) => (
                      <motion.div 
                        key={comment.id} 
                        className="flex gap-2"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.3 }}
                      >
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
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}