import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Save, Plus, X, FileText, Edit, RefreshCw, FileCheck, Upload, HardDrive, Cloud, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ReviewEditorProps {
  existingReviewSlug?: string;
  onSave?: () => void;
}

interface ReviewData {
  slug: string;
  title: string;
  game_title: string;
  genre: string;
  rating: number;
  publish_date: string;
  author: string;
  image_url: string;
  introduccion: string;
  argumento: string;
  gameplay: string;
  funciones: string;
  duracion: string;
  valoracion_personal: string;
  imagenes: string[];
  video_url: string[];
  status: 'draft' | 'published';
}

const LOCAL_STORAGE_KEY = 'juega-y-calla-draft-review';
const AUTOSAVE_INTERVAL = 5000; // 5 seconds

export const ReviewEditor = ({ existingReviewSlug, onSave }: ReviewEditorProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [availableReviews, setAvailableReviews] = useState<Array<{ slug: string; title: string; status: string }>>([]);
  const [selectedReviewSlug, setSelectedReviewSlug] = useState<string>('');
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'draft' | 'published' | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<ReviewData>({
    slug: '',
    title: '',
    game_title: '',
    genre: '',
    rating: 0,
    publish_date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
    author: 'Juega Y Calla',
    image_url: '',
    introduccion: '',
    argumento: '',
    gameplay: '',
    funciones: '',
    duracion: '',
    valoracion_personal: '',
    imagenes: [''],
    video_url: [''],
    status: 'draft',
  });

  // Save to localStorage
  const saveToLocalStorage = (data: ReviewData) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({
        data,
        timestamp: new Date().toISOString(),
      }));
      setLastSavedTime(new Date());
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  // Load from localStorage
  const loadFromLocalStorage = (): ReviewData | null => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const { data } = JSON.parse(saved);
        setLastSavedTime(new Date());
        return data;
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
    return null;
  };

  // Clear localStorage after successful upload
  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setLastSavedTime(null);
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  };

  // Delete local draft manually
  const handleDeleteLocalDraft = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar el borrador local? Esta acción no se puede deshacer.')) {
      clearLocalStorage();
      handleNewReview();
      toast({
        title: 'Borrador eliminado',
        description: 'El borrador local se ha eliminado correctamente',
      });
    }
  };

  // Load available reviews on mount
  useEffect(() => {
    fetchAvailableReviews();
    
    // Load draft from localStorage if exists
    const savedDraft = loadFromLocalStorage();
    if (savedDraft && !existingReviewSlug) {
      setFormData(savedDraft);
      toast({
        title: 'Borrador recuperado',
        description: 'Se ha cargado tu trabajo guardado localmente',
      });
    }
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    if (mode === 'create' && formData.title) {
      const timer = setTimeout(() => {
        saveToLocalStorage(formData);
      }, AUTOSAVE_INTERVAL);

      return () => clearTimeout(timer);
    }
  }, [formData, mode]);

  // Load existing review if editing
  useEffect(() => {
    if (existingReviewSlug) {
      loadReview(existingReviewSlug);
    }
  }, [existingReviewSlug]);

  const fetchAvailableReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('slug, title, status')
        .order('status', { ascending: true }) // drafts first
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cast to include status field (not in generated types yet)
      setAvailableReviews((data as any) || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const loadReview = async (slug: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      if (data) {
        // Cast data to include all fields (genre and video_url are in DB but not in generated types yet)
        const reviewData = data as any;
        
        setFormData({
          slug: reviewData.slug,
          title: reviewData.title,
          game_title: reviewData.game_title || reviewData.title,
          genre: reviewData.genre || '',
          rating: reviewData.rating,
          publish_date: reviewData.publish_date,
          author: reviewData.author,
          image_url: reviewData.image_url,
          introduccion: reviewData.introduccion,
          argumento: reviewData.argumento,
          gameplay: reviewData.gameplay,
          funciones: reviewData.funciones,
          duracion: reviewData.duracion,
          valoracion_personal: reviewData.valoracion_personal,
          imagenes: reviewData.imagenes || [''],
          video_url: reviewData.video_url || [''],
          status: reviewData.status || 'published',
        });
        setMode('edit');
        setSelectedReviewSlug(slug);
      }
    } catch (error) {
      console.error('Error loading review:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la reseña',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNewReview = () => {
    // Try to load from localStorage first
    const savedDraft = loadFromLocalStorage();
    
    if (savedDraft) {
      setFormData(savedDraft);
      toast({
        title: 'Borrador recuperado',
        description: 'Se ha cargado tu trabajo guardado localmente',
      });
    } else {
      setFormData({
        slug: '',
        title: '',
        game_title: '',
        genre: '',
        rating: 0,
        publish_date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
        author: 'Juega Y Calla',
        image_url: '',
        introduccion: '',
        argumento: '',
        gameplay: '',
        funciones: '',
        duracion: '',
        valoracion_personal: '',
        imagenes: [''],
        video_url: [''],
        status: 'draft',
      });
    }
    setMode('create');
    setSelectedReviewSlug('');
  };

  const handleSelectReview = (slug: string) => {
    if (slug === 'new') {
      handleNewReview();
    } else {
      loadReview(slug);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-'); // Remove duplicate hyphens
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title),
      game_title: title,
    }));
  };

  const handleAddImage = () => {
    setFormData(prev => ({
      ...prev,
      imagenes: [...prev.imagenes, ''],
    }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.filter((_, i) => i !== index),
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      imagenes: prev.imagenes.map((img, i) => (i === index ? value : img)),
    }));
  };

  const handleAddVideo = () => {
    setFormData(prev => ({
      ...prev,
      video_url: [...prev.video_url, ''],
    }));
  };

  const handleRemoveVideo = (index: number) => {
    setFormData(prev => ({
      ...prev,
      video_url: prev.video_url.filter((_, i) => i !== index),
    }));
  };

  const handleVideoChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      video_url: prev.video_url.map((vid, i) => (i === index ? value : vid)),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'El título es obligatorio',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.rating < 0 || formData.rating > 5) {
      toast({
        title: 'Error',
        description: 'El rating debe estar entre 0 y 5',
        variant: 'destructive',
      });
      return false;
    }

    if (!formData.image_url.trim()) {
      toast({
        title: 'Error',
        description: 'La imagen de portada es obligatoria',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const openConfirmDialog = (action: 'draft' | 'published') => {
    // For drafts, only validate title
    if (action === 'draft' && !formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'El título es obligatorio para subir a Supabase',
        variant: 'destructive',
      });
      return;
    }

    // For published, validate everything
    if (action === 'published' && !validateForm()) {
      return;
    }

    setPendingAction(action);
    setConfirmDialogOpen(true);
  };

  const handleUploadToSupabase = async () => {
    if (!pendingAction) return;

    setSaving(true);
    setConfirmDialogOpen(false);
    
    try {
      // Clean empty strings from arrays
      const cleanedData = {
        ...formData,
        status: pendingAction,
        imagenes: formData.imagenes.filter(img => img.trim() !== ''),
        video_url: formData.video_url.filter(vid => vid.trim() !== ''),
      };

      if (mode === 'edit') {
        // Update existing review
        const { error } = await supabase
          .from('reviews')
          .update(cleanedData)
          .eq('slug', formData.slug);

        if (error) throw error;

        toast({
          title: pendingAction === 'draft' ? 'Borrador subido' : 'Reseña publicada',
          description: pendingAction === 'draft' 
            ? 'El borrador se ha subido a Supabase (no visible públicamente)' 
            : 'La reseña se ha publicado y es visible para todos',
        });
      } else {
        // Create new review
        const { error } = await supabase
          .from('reviews')
          .insert(cleanedData);

        if (error) throw error;

        toast({
          title: pendingAction === 'draft' ? 'Borrador subido' : 'Reseña publicada',
          description: pendingAction === 'draft'
            ? 'El borrador se ha subido a Supabase (no visible públicamente)'
            : 'La reseña se ha publicado correctamente',
        });

        // Clear localStorage after successful upload
        clearLocalStorage();

        // Refresh available reviews list
        fetchAvailableReviews();

        // Reset form after creation
        handleNewReview();
      }

      onSave?.();
    } catch (error) {
      console.error('Error uploading to Supabase:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir la reseña. Verifica los datos e intenta de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setPendingAction(null);
    }
  };

  const handleExportJSON = () => {
    const jsonData = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.slug || 'review'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'JSON exportado',
      description: 'El archivo JSON se ha descargado correctamente',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Review Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Seleccionar Reseña</CardTitle>
          <CardDescription>Elige una reseña existente para editar o crea una nueva</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="review-select">Reseña</Label>
              <Select
                value={selectedReviewSlug || 'new'}
                onValueChange={handleSelectReview}
              >
                <SelectTrigger id="review-select">
                  <SelectValue placeholder="Selecciona una reseña..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Nueva Reseña</span>
                    </div>
                  </SelectItem>
                  {availableReviews.map((review) => (
                    <SelectItem key={review.slug} value={review.slug}>
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        <span>{review.title}</span>
                        {review.status === 'draft' && (
                          <Badge variant="secondary" className="ml-2 text-xs">Borrador</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              onClick={() => fetchAvailableReviews()}
              size="icon"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            {mode === 'edit' ? 'Editar Reseña' : 'Nueva Reseña'}
            {formData.status === 'draft' && (
              <Badge variant="secondary">Borrador</Badge>
            )}
            {formData.status === 'published' && mode === 'edit' && (
              <Badge variant="default">Publicada</Badge>
            )}
          </h2>
          <div className="flex flex-col gap-1">
            <p className="text-muted-foreground">
              {mode === 'edit' 
                ? 'Modifica los campos y sube los cambios a Supabase cuando estés listo'
                : 'Escribe tu reseña. Se guarda automáticamente en local cada 5 segundos'}
            </p>
            {mode === 'create' && lastSavedTime && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <HardDrive className="h-3 w-3" />
                  Último guardado local: {lastSavedTime.toLocaleTimeString('es-ES')}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteLocalDraft}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Borrar borrador local
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleExportJSON}
            disabled={!formData.title}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => openConfirmDialog('draft')}
            disabled={saving}
            className="border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
          >
            {saving && pendingAction === 'draft' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Cloud className="h-4 w-4 mr-2" />
                Subir como Borrador
              </>
            )}
          </Button>
          <Button
            onClick={() => openConfirmDialog('published')}
            disabled={saving}
            className="bg-green-600 hover:bg-green-700"
          >
            {saving && pendingAction === 'published' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                {mode === 'edit' && formData.status === 'published' ? 'Actualizar y Publicar' : 'Subir y Publicar'}
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
            <CardDescription>Datos principales de la reseña</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Ej: Resident Evil 7: Biohazard"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (generado automáticamente)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  readOnly
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="genre">Género</Label>
                <Input
                  id="genre"
                  value={formData.genre}
                  onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
                  placeholder="Ej: Terror, Survival Horror"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5) *</Label>
                <Input
                  id="rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={formData.rating}
                  onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="author">Autor</Label>
                <Input
                  id="author"
                  value={formData.author}
                  onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="publish_date">Fecha de Publicación</Label>
              <Input
                id="publish_date"
                value={formData.publish_date}
                onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                placeholder="Ej: 16 de Febrero de 2026"
              />
            </div>
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle>Multimedia</CardTitle>
            <CardDescription>Imágenes y videos de la reseña</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image_url">Imagen de Portada (URL) *</Label>
              <Input
                id="image_url"
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://images.igdb.com/..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Galería de Imágenes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddImage}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Imagen
                </Button>
              </div>
              {formData.imagenes.map((img, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={img}
                    onChange={(e) => handleImageChange(index, e.target.value)}
                    placeholder={`URL de imagen ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveImage(index)}
                    disabled={formData.imagenes.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Videos</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVideo}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Añadir Video
                </Button>
              </div>
              {formData.video_url.map((vid, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={vid}
                    onChange={(e) => handleVideoChange(index, e.target.value)}
                    placeholder={`URL de video ${index + 1} (YouTube)`}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveVideo(index)}
                    disabled={formData.video_url.length === 1}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Sections */}
        <Card>
          <CardHeader>
            <CardTitle>Contenido de la Reseña</CardTitle>
            <CardDescription>
              Escribe el contenido de cada sección. Los saltos de línea se guardan automáticamente. 
              <br />
              <strong>Formato especial:</strong> Bullets con · (Alt+0183) | Spoilers: <code>---A PARTIR DE AQUÍ: SPOILERS---</code> | Comillas se escapan automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="introduccion">Introducción</Label>
              <Textarea
                id="introduccion"
                value={formData.introduccion}
                onChange={(e) => setFormData(prev => ({ ...prev, introduccion: e.target.value }))}
                placeholder="Escribe la introducción...\n\nTips: \n- Saltos de línea: Enter (se guardan automáticamente)\n- Comillas: Escribe normal, se escapan automáticamente\n- Bullets: Usa · (Alt+0183)"
                className="min-h-[150px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.introduccion.length} caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="argumento">Argumento</Label>
              <Textarea
                id="argumento"
                value={formData.argumento}
                onChange={(e) => setFormData(prev => ({ ...prev, argumento: e.target.value }))}
                placeholder="Describe la historia y trama del juego...\n\nPara marcar spoilers usa:\n---A PARTIR DE AQUÍ: SPOILERS---\n\n(Después del texto de spoilers sigue escribiendo normal)"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.argumento.length} caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gameplay">Gameplay</Label>
              <Textarea
                id="gameplay"
                value={formData.gameplay}
                onChange={(e) => setFormData(prev => ({ ...prev, gameplay: e.target.value }))}
                placeholder="Explica las mecánicas de juego..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.gameplay.length} caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="funciones">Funciones</Label>
              <Textarea
                id="funciones"
                value={formData.funciones}
                onChange={(e) => setFormData(prev => ({ ...prev, funciones: e.target.value }))}
                placeholder="Describe las funciones y características especiales...\n\nEjemplo de bullets:\n·Combate: Descripción...\n\n ·Inventario: Descripción...\n\n(Bullets con Alt+0183 en Windows)"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.funciones.length} caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duracion">Duración</Label>
              <Textarea
                id="duracion"
                value={formData.duracion}
                onChange={(e) => setFormData(prev => ({ ...prev, duracion: e.target.value }))}
                placeholder="Indica la duración aproximada del juego..."
                className="min-h-[100px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.duracion.length} caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valoracion_personal">Valoración Personal</Label>
              <Textarea
                id="valoracion_personal"
                value={formData.valoracion_personal}
                onChange={(e) => setFormData(prev => ({ ...prev, valoracion_personal: e.target.value }))}
                placeholder="Escribe tu opinión personal sobre el juego...\n\nPuedes incluir spoilers con:\n---A partir de aquí: SPOILERS---"
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {formData.valoracion_personal.length} caracteres
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === 'draft' ? '¿Subir como Borrador?' : '¿Publicar Reseña?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === 'draft' ? (
                <>
                  Se subirá la reseña a Supabase con estado <strong>Borrador</strong>.
                  <br /><br />
                  • No será visible para el público<br />
                  • Solo tú podrás verla en el panel de administración<br />
                  • Puedes editarla y publicarla cuando estés listo<br />
                  • El guardado local se limpiará automáticamente
                </>
              ) : (
                <>
                  Se subirá la reseña a Supabase con estado <strong>Publicada</strong>.
                  <br /><br />
                  • Será visible para todos los visitantes<br />
                  • Aparecerá en el listado público de reseñas<br />
                  • Podrás editarla en cualquier momento<br />
                  • El guardado local se limpiará automáticamente
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUploadToSupabase}
              className={pendingAction === 'draft' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {pendingAction === 'draft' ? 'Subir Borrador' : 'Publicar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
