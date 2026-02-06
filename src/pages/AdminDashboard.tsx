import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Upload, 
  BarChart3, 
  LogOut,
  ThumbsUp,
  ThumbsDown,
  Eye,
  FileText,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface CommentData {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  review_id: string;
  reviews?: {
    title: string;
    slug: string;
  };
}

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [comments, setComments] = useState<CommentData[]>([]);
  const [filteredComments, setFilteredComments] = useState<CommentData[]>([]);
  const [reviewFilter, setReviewFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    totalComments: 0,
    totalLikes: 0,
    totalDislikes: 0,
    totalViews: 0,
  });
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Cargar comentarios y stats de Supabase
  useEffect(() => {
    if (activeTab === 'comments') {
      fetchComments();
      fetchReviews();
    } else if (activeTab === 'dashboard') {
      fetchStats();
    }
  }, [activeTab]);

  useEffect(() => {
    if (reviewFilter === 'all') {
      setFilteredComments(comments);
    } else {
      setFilteredComments(comments.filter(c => c.reviews?.slug === reviewFilter));
    }
  }, [reviewFilter, comments]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          author_name,
          content,
          created_at,
          review_id,
          reviews (title, slug)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
      setFilteredComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los comentarios',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, title, slug')
        .order('title');

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching reviews:', error);
      }
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return;
    }

    setLoading(true);
    try {
      if (import.meta.env.DEV) {
        console.log('🔐 Eliminando comentario vía API:', commentId);
      }

      // Obtener el token de admin desde sessionStorage
      const adminToken = sessionStorage.getItem('admin_token');
      
      if (!adminToken) {
        throw new Error('Sesión de admin no encontrada. Por favor, inicia sesión nuevamente.');
      }

      // Llamar a la API backend (Vercel) que tiene acceso a la Service Role Key
      const response = await fetch('/api/admin/delete-comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          adminToken
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al eliminar el comentario');
      }

      if (import.meta.env.DEV) {
        console.log('✅ Comentario eliminado exitosamente:', result);
      }

      toast({
        title: '✅ Éxito',
        description: 'Comentario eliminado correctamente'
      });

      await fetchComments();
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('❌ Error deleting comment:', error);
      }
      
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el comentario',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Obtener stats agregadas de todas las reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('likes_count, dislikes_count, views_count, comments_count');

      if (reviewsError) throw reviewsError;

      if (reviewsData) {
        const totals = reviewsData.reduce((acc, review) => ({
          totalLikes: acc.totalLikes + (review.likes_count || 0),
          totalDislikes: acc.totalDislikes + (review.dislikes_count || 0),
          totalViews: acc.totalViews + (review.views_count || 0),
          totalComments: acc.totalComments + (review.comments_count || 0),
        }), { totalLikes: 0, totalDislikes: 0, totalViews: 0, totalComments: 0 });

        setStats({
          totalReviews: reviewsData.length,
          ...totals
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error fetching stats:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Panel Admin</h1>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="dashboard">
              <LayoutDashboard className="h-4 w-4 mr-2" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-4 w-4 mr-2" />
              Comentarios
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-4 w-4 mr-2" />
              Subir Reseña
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Estadísticas
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Bienvenido al Panel de Administración</h2>
              <p className="text-muted-foreground">Resumen general de la plataforma</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Reseñas</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalReviews}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total publicadas
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Comentarios</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalComments}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pendientes moderación
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Likes</CardTitle>
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalLikes}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total positivos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Dislikes</CardTitle>
                  <ThumbsDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDislikes}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total negativos
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Visitas</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total acumuladas
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Últimos eventos en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">No hay actividad reciente</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Comentarios</CardTitle>
                <CardDescription>Modera y elimina comentarios inapropiados (requisito RGPD)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Filtro por reseña */}
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium">Filtrar por reseña:</label>
                    <select
                      value={reviewFilter}
                      onChange={(e) => setReviewFilter(e.target.value)}
                      className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="all">Todas las reseñas</option>
                      {reviews.map(review => (
                        <option key={review.id} value={review.slug}>
                          {review.title}
                        </option>
                      ))}
                    </select>
                    <Button onClick={fetchComments} variant="outline" size="sm">
                      Actualizar
                    </Button>
                  </div>

                  {/* Lista de comentarios */}
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Cargando comentarios...</p>
                  ) : filteredComments.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-sm text-muted-foreground">
                        {reviewFilter === 'all' ? 'No hay comentarios aún' : 'No hay comentarios en esta reseña'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Mostrando {filteredComments.length} comentario{filteredComments.length !== 1 ? 's' : ''}
                      </p>
                      {filteredComments.map(comment => (
                        <Card key={comment.id} className="border-l-4 border-l-primary">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="font-semibold text-foreground">{comment.author_name}</span>
                                  <span>•</span>
                                  <span>{new Date(comment.created_at).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}</span>
                                  {comment.reviews && (
                                    <>
                                      <span>•</span>
                                      <span className="text-primary font-medium">{comment.reviews.title}</span>
                                    </>
                                  )}
                                </div>
                                <p className="text-sm">{comment.content}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteComment(comment.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Info RGPD */}
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Requisito RGPD - Derecho al Olvido</p>
                      <p className="text-blue-800 dark:text-blue-200">
                        Según el RGPD (Art. 17), los usuarios tienen derecho a solicitar la eliminación de sus datos personales. 
                        Los comentarios se consideran datos personales al incluir nombres/pseudónimos.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Subir Nueva Reseña</CardTitle>
                <CardDescription>Añade una nueva reseña en formato JSON</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Esta funcionalidad permite subir archivos JSON de reseñas directamente al sistema.
                  </p>
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Formato JSON requerido:</h4>
                    <pre className="text-xs bg-background p-3 rounded overflow-x-auto">
{`{
  "slug": "nombre-juego",
  "title": "Título del Juego",
  "game_title": "Título del Juego",
  "rating": 9.5,
  "author": "Juega y Calla",
  "publish_date": "2024-01-15",
  "image_url": "https://images.igdb.com/...",
  "genre": "Acción/Aventura",
  "introduccion": "...",
  "argumento": "...",
  "gameplay": "...",
  "funciones": "...",
  "duracion": "...",
  "valoracion_personal": "...",
  "imagenes": [...],
  "video_url": [...]
}`}
                    </pre>
                  </div>
                  <Button variant="outline" className="w-full" disabled>
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Archivo JSON (Próximamente)
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Por ahora, añade reseñas manualmente en la carpeta /reviews/
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas Detalladas</CardTitle>
                <CardDescription>Análisis profundo de métricas</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Cuando conectes Google Analytics, aquí verás estadísticas avanzadas.
                </p>
                <div className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="font-semibold mb-2">Métricas disponibles (futuro):</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Reseñas más vistas por período</li>
                      <li>Ratio de engagement (likes/visitas)</li>
                      <li>Tiempo promedio de lectura</li>
                      <li>Géneros más populares</li>
                      <li>Tendencias de tráfico</li>
                      <li>Origen de visitas (referral sources)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
