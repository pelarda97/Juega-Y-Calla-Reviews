import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, ThumbsUp, Calendar, User, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useThreadedComments, Comment } from "@/hooks/useThreadedComments";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateCommentContent, validateAuthorName, sanitizeContent } from '@/utils/contentFilter';
import { useCommentCooldown } from "@/hooks/useCommentCooldown";

interface CommentThreadProps {
  comment: Comment;
  replyingTo: string | null;
  setReplyingTo: (id: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  replyAuthor: string;
  setReplyAuthor: (author: string) => void;
  onSubmitReply: (parentId: string) => void;
  submitting: boolean;
  getInitials: (name: string) => string;
  canReply: boolean;
  replyTimeRemaining: string;
  hasReachedDailyLimit: boolean;
}

const CommentThread = ({
  comment,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  replyAuthor,
  setReplyAuthor,
  onSubmitReply,
  submitting,
  getInitials,
  canReply,
  replyTimeRemaining,
  hasReachedDailyLimit
}: CommentThreadProps) => {
  const isReplying = replyingTo === comment.id;

  return (
    <Card>
      <CardContent className="pt-6">
        {/* Main Comment */}
        <div className="flex items-start gap-4">
          <Avatar>
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
              {getInitials(comment.author_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span className="font-medium">{comment.author_name}</span>
              <Calendar className="h-4 w-4 ml-2" />
              <span>{new Date(comment.created_at).toLocaleDateString('es-ES')}</span>
            </div>
            <p className="text-foreground leading-relaxed">
              {comment.content}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ThumbsUp className="h-4 w-4 mr-1" />
                {comment.likes_count || 0}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                disabled={hasReachedDailyLimit || !canReply}
                title={hasReachedDailyLimit ? "Límite diario alcanzado" : !canReply ? `Espera ${replyTimeRemaining}` : ""}
              >
                <Reply className="h-4 w-4 mr-1" />
                {hasReachedDailyLimit ? "Límite alcanzado" : !canReply ? `Espera ${replyTimeRemaining}` : "Responder"}
              </Button>
            </div>
          </div>
        </div>

        {/* Reply Form */}
        {isReplying && (
          <div className="mt-4 ml-12 space-y-3 border-l-2 border-primary pl-4">
            <Input
              placeholder="Tu nombre o alias"
              value={replyAuthor}
              onChange={(e) => setReplyAuthor(e.target.value)}
            />
            <Textarea
              placeholder="Escribe tu respuesta..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {replyContent.length}/300 caracteres
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onSubmitReply(comment.id)}
                disabled={submitting}
              >
                {submitting ? "Publicando..." : "Publicar Respuesta"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReplyingTo(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 ml-12 space-y-4 border-l-2 border-muted pl-4">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
                    {getInitials(reply.author_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{reply.author_name}</span>
                    <span>•</span>
                    <span>{new Date(reply.created_at).toLocaleDateString('es-ES')}</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {reply.content}
                  </p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground">
                    <ThumbsUp className="h-3 w-3 mr-1" />
                    {reply.likes_count || 0}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const Comments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAuthor, setReplyAuthor] = useState("");
  const { toast } = useToast();
  
  const { comments, loading } = useThreadedComments(id || '');
  const {
    canComment,
    canReply,
    recordComment,
    mainCommentTimeRemaining,
    replyTimeRemaining,
    remainingDailyComments,
    hasReachedDailyLimit,
  } = useCommentCooldown(id || '');

  const handleSubmitComment = async (parentId: string | null = null) => {
    const content = parentId ? replyContent : newComment;
    const author = parentId ? replyAuthor : authorName;

    if (!content.trim() || !author.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      });
      return;
    }

    // Check daily limit
    if (hasReachedDailyLimit) {
      toast({
        title: "Límite diario alcanzado",
        description: `Has alcanzado el límite de ${10} comentarios por reseña en 24 horas. Intenta mañana.`,
        variant: "destructive"
      });
      return;
    }

    // Check cooldown
    if (parentId && !canReply) {
      toast({
        title: "Por favor espera",
        description: `Puedes responder de nuevo en ${replyTimeRemaining}`,
        variant: "destructive"
      });
      return;
    }

    if (!parentId && !canComment) {
      toast({
        title: "Por favor espera",
        description: `Puedes comentar de nuevo en ${mainCommentTimeRemaining}`,
        variant: "destructive"
      });
      return;
    }

    // Validar contenido del comentario
    const validation = validateCommentContent(content);
    if (!validation.isValid) {
      toast({
        title: "Contenido no permitido",
        description: validation.reason,
        variant: "destructive"
      });
      return;
    }

    // Validar nombre del autor con validación específica más estricta
    const authorValidation = validateAuthorName(author);
    if (!authorValidation.isValid) {
      toast({
        title: "Nombre no permitido",
        description: authorValidation.reason || "Por favor usa un nombre apropiado",
        variant: "destructive"
      });
      return;
    }

    // Sanitizar contenido antes de enviar
    const sanitizedContent = sanitizeContent(content);
    const sanitizedAuthor = sanitizeContent(author);

    setSubmitting(true);
    try {
      // Get review ID
      const { data: reviewData, error: reviewError } = await supabase
        .from('reviews')
        .select('id')
        .eq('slug', id)
        .maybeSingle();

      if (import.meta.env.DEV) {
        console.log('🔍 Review query result:', { reviewData, reviewError, slug: id });
      }

      if (reviewError) {
        if (import.meta.env.DEV) {
          console.error('❌ Error fetching review:', reviewError);
        }
        throw reviewError;
      }

      if (!reviewData) {
        if (import.meta.env.DEV) {
          console.error('❌ Review not found for slug:', id);
        }
        throw new Error('Review not found');
      }

      // Insert comment or reply
      const { error } = await supabase
        .from('comments')
        .insert({
          review_id: reviewData.id,
          author_name: sanitizedAuthor,
          content: sanitizedContent,
          parent_comment_id: parentId
        });

      if (error) throw error;

      // Record comment for cooldown tracking AFTER successful insert
      // This ensures the cooldown starts immediately
      recordComment(!!parentId);

      // Clear form
      if (parentId) {
        setReplyContent("");
        setReplyAuthor("");
        setReplyingTo(null);
      } else {
        setNewComment("");
        setAuthorName("");
      }

      toast({
        title: parentId ? "¡Respuesta publicada!" : "¡Comentario publicado!",
        description: "Tu mensaje ha sido añadido correctamente"
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error submitting comment:', error);
      }
      toast({
        title: "Error",
        description: "No se pudo publicar el mensaje. Inténtalo de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
  };

  // Get review title from the review titles map
  const reviewTitles: { [key: string]: string } = {
    "the-last-of-us-2": "The Last of Us Part II - Una obra maestra controversial",
    "clair-obscur-expedition-33": "Clair Obscur: Expedition 33 - Un RPG prometedor"
  };

  const reviewTitle = reviewTitles[id || ""] || "Reseña";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/review/${id}`)}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la Reseña
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Comentarios
            </h1>
            <p className="text-muted-foreground mt-1">
              {reviewTitle}
            </p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {/* Comment Form */}
          <div className="md:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">Escribe un comentario</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="authorName" className="block text-sm font-medium text-foreground mb-2">
                    Tu nombre
                  </label>
                  <Input
                    id="authorName"
                    type="text"
                    placeholder="Escribe tu nombre..."
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="comment" className="block text-sm font-medium text-foreground mb-2">
                    Tu comentario
                  </label>
                  <Textarea
                    id="comment"
                    placeholder="Comparte tu opinión sobre esta reseña..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[100px] resize-none"
                    disabled={hasReachedDailyLimit || !canComment}
                    maxLength={300}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {newComment.length}/300 caracteres
                  </p>
                </div>
                
                {/* Cooldown / Limit Info */}
                {hasReachedDailyLimit && (
                  <p className="text-sm text-destructive">
                    Límite diario alcanzado: {remainingDailyComments}/10 comentarios restantes
                  </p>
                )}
                {!hasReachedDailyLimit && !canComment && (
                  <p className="text-sm text-muted-foreground">
                    Puedes comentar de nuevo en: {mainCommentTimeRemaining}
                  </p>
                )}
                {!hasReachedDailyLimit && canComment && remainingDailyComments < 10 && (
                  <p className="text-sm text-muted-foreground">
                    Comentarios restantes hoy: {remainingDailyComments}/10
                  </p>
                )}
                
                <Button 
                  onClick={() => handleSubmitComment(null)}
                  disabled={submitting || hasReachedDailyLimit || !canComment}
                  className="w-full"
                  variant="gaming"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  {submitting ? "Publicando..." : hasReachedDailyLimit ? "Límite alcanzado" : !canComment ? `Espera ${mainCommentTimeRemaining}` : "Publicar Comentario"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Comments List */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-semibold text-foreground mb-6">
              Comentarios de la comunidad
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Cargando comentarios...</p>
              </div>
            ) : comments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No hay comentarios aún
                  </h3>
                  <p className="text-muted-foreground">
                    Sé el primero en compartir tu opinión sobre esta reseña
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <CommentThread
                    key={comment.id}
                    comment={comment}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    replyAuthor={replyAuthor}
                    setReplyAuthor={setReplyAuthor}
                    onSubmitReply={handleSubmitComment}
                    submitting={submitting}
                    getInitials={getInitials}
                    canReply={canReply}
                    replyTimeRemaining={replyTimeRemaining}
                    hasReachedDailyLimit={hasReachedDailyLimit}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16">
          <Card className="border-border bg-gradient-to-r from-primary/5 to-accent/5">
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-bold text-foreground mb-4">
                ¿Te gustan nuestras reseñas?
              </h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Descubre más análisis detallados de los mejores juegos del momento
              </p>
              <Button 
                variant="gaming" 
                size="lg"
                onClick={() => navigate('/reviews')}
                className="font-semibold"
              >
                Ver Todas las Reviews
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Comments;