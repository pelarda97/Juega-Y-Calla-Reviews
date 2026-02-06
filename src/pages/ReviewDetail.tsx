import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Calendar, User, Gamepad2, BookOpen, Settings, ThumbsUp, ThumbsDown, MessageCircle, FileText, Timer, Heart, Camera, AlertTriangle, ChevronDown, Eye, X, ChevronLeft, ChevronRight, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GamepadIcon from "@/components/GamepadIcon";
import { useRealtimeStats } from "@/hooks/useRealtimeStats";
import { useLikeDislike } from "@/hooks/useLikeDislike";
import { usePageViews } from "@/hooks/useRealtimeStats";
import { supabase } from "@/integrations/supabase/client";
import gamingHero from "@/assets/gaming-hero.jpg";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { mockReviews, USE_MOCK_DATA } from "@/data/mockReviews";

// Función para convertir saltos de línea: \n simple = <br/>, \n\n = doble <br/> con espacio
const formatTextWithLineBreaks = (text: string) => {
  if (!text) return null;
  
  // Primero dividimos por \n pero necesitamos detectar \n\n
  const parts: JSX.Element[] = [];
  const lines = text.split('\n');
  
  lines.forEach((line, index) => {
    // Añadimos el contenido de la línea
    parts.push(<span key={`line-${index}`}>{line}</span>);
    
    // Si no es la última línea, añadimos el salto
    if (index < lines.length - 1) {
      // Chequeamos si la línea siguiente está vacía (lo que indica \n\n)
      if (lines[index + 1] === '' && index + 1 < lines.length) {
        // Salto doble: añadimos <br/> con margen
        parts.push(<br key={`br1-${index}`} />);
        parts.push(<br key={`br2-${index}`} />);
      } else if (line !== '') {
        // Salto simple: solo <br/>
        parts.push(<br key={`br-${index}`} />);
      }
    }
  });
  
  return parts;
};

const ReviewDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageDirection, setImageDirection] = useState<'left' | 'right' | null>(null);
  const [openSpoilers, setOpenSpoilers] = useState<{ [key: string]: boolean }>({});
  const [galleryExpanded, setGalleryExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const { stats } = useRealtimeStats(id || '');
  const { userVote, handleVote, loading: voteLoading } = useLikeDislike(id || '');
  const { recordPageView } = usePageViews();
  const scrollDirection = useScrollDirection();
  const [navBarPassed, setNavBarPassed] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [allowAutoHide, setAllowAutoHide] = useState(true);

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Detectar interacción real del usuario (wheel/touch) para reactivar auto-hide después de navegación por clic
  useEffect(() => {
    if (!allowAutoHide) {
      const handleUserInteraction = () => {
        // Reactivar auto-hide cuando el usuario interactúa activamente (wheel o touch)
        setAllowAutoHide(true);
      };

      // Escuchar eventos de interacción real del usuario
      window.addEventListener('wheel', handleUserInteraction, { passive: true });
      window.addEventListener('touchstart', handleUserInteraction, { passive: true });
      
      return () => {
        window.removeEventListener('wheel', handleUserInteraction);
        window.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [allowAutoHide]);

  // Detectar cuando hemos pasado la barra de navegación
  useEffect(() => {
    const handleScroll = () => {
      const navBar = document.getElementById('section-nav-bar');
      if (navBar) {
        const navBarRect = navBar.getBoundingClientRect();
        // La barra se considera "pasada" cuando su parte superior está por encima o en el header
        // Es decir, cuando ya está sticky y pegada al header
        setNavBarPassed(navBarRect.top <= 64);
      }
    };

    // Ejecutar una vez al montar para establecer estado inicial
    handleScroll();
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentImageIndex < galleryItems.length - 1) {
      // Swipe left = next image
      setImageDirection('right');
      setTimeout(() => {
        setCurrentImageIndex(prev => prev + 1);
        setImageDirection(null);
      }, 100);
    }
    
    if (isRightSwipe && currentImageIndex > 0) {
      // Swipe right = previous image
      setImageDirection('left');
      setTimeout(() => {
        setCurrentImageIndex(prev => prev - 1);
        setImageDirection(null);
      }, 100);
    }
  };

  // Fetch review data from database
  useEffect(() => {
    const fetchReview = async () => {
      if (!id) return;
      
      try {
        // Si USE_MOCK_DATA está activado, buscar en datos locales
        if (USE_MOCK_DATA) {
          const mockReview = mockReviews.find(r => r.slug === id);
          
          if (mockReview) {
            setReview({
              id: mockReview.slug,
              title: mockReview.title,
              gameTitle: mockReview.game_title,
              rating: mockReview.rating,
              author: mockReview.author,
              publishDate: mockReview.publish_date,
              image: mockReview.image_url || gamingHero,
              introduccion: mockReview.introduccion,
              argumento: mockReview.argumento,
              gameplay: mockReview.gameplay,
              funciones: mockReview.funciones,
              duracion: mockReview.duracion,
              valoracion_personal: mockReview.valoracion_personal,
              imagenes: mockReview.imagenes || [],
              video_url: mockReview.video_url || null
            });
          }
          setLoading(false);
          return;
        }
        
        // Si no, intentar cargar desde Supabase
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('slug', id)
          .single();
        
        if (error) throw error;
        
        if (data) {
          setReview({
            id: data.slug,
            title: data.title,
            gameTitle: data.game_title,
            rating: data.rating,
            author: data.author,
            publishDate: data.publish_date,
            image: data.image_url || gamingHero,
            introduccion: data.introduccion,
            argumento: data.argumento,
            gameplay: data.gameplay,
            funciones: data.funciones,
            duracion: data.duracion,
            valoracion_personal: data.valoracion_personal,
            imagenes: data.imagenes || [],
            video_url: (data as any).video_url || null
          });
          
          // Record page view
          recordPageView('review', id);
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Error fetching review:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [id]); // Solo depende de id, recordPageView es estable (useCallback)

  const renderGamepads = (rating: number) => {
    return [...Array(5)].map((_, i) => {
      const currentValue = i + 1;
      const isFullGamepad = rating >= currentValue;
      const isHalfGamepad = rating >= currentValue - 0.5 && rating < currentValue;
      
      return (
        <GamepadIcon
          key={i}
          filled={isFullGamepad}
          halfFilled={isHalfGamepad}
          className="h-7 w-7"
        />
      );
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase();
  };

  // Helper functions for video detection and processing
  const getYouTubeVideoId = (url: string): string | null => {
    // Si ya es una URL embed, extraer el ID directamente
    if (url.includes('/embed/')) {
      const embedMatch = url.match(/\/embed\/([^?&]+)/);
      if (embedMatch) return embedMatch[1];
    }
    
    // Para otros formatos de YouTube
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const isDirectVideo = (url: string): boolean => {
    return /\.(mp4|webm|ogg)$/i.test(url);
  };

  const isYouTubeVideo = (url: string): boolean => {
    return /(?:youtube\.com|youtu\.be)/.test(url);
  };

  // Create gallery items array (images + videos if exist)
  const galleryItems = review ? [
    ...(review.imagenes || []).map((url: string) => ({ type: 'image' as const, url })),
    ...(review.video_url ? 
      (Array.isArray(review.video_url) 
        ? review.video_url.map((url: string) => ({ type: 'video' as const, url }))
        : [{ type: 'video' as const, url: review.video_url }]
      ) : [])
  ] : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header isNavigating={isNavigating} allowAutoHide={allowAutoHide} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Cargando reseña...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="min-h-screen bg-background">
        <Header isNavigating={isNavigating} allowAutoHide={allowAutoHide} />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Reseña no encontrada</h1>
            <Button 
              onClick={() => navigate('/reviews')} 
              className="mt-4"
              variant="outline"
            >
              Volver a Reseñas
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const sections = [
    { title: "Introducción", content: review.introduccion, icon: FileText },
    { title: "Argumento", content: review.argumento, icon: BookOpen },
    { title: "Gameplay", content: review.gameplay, icon: Gamepad2 },
    { title: "Funciones", content: review.funciones, icon: Settings },
    { title: "Duración", content: review.duracion, icon: Timer },
    { title: "Valoración Personal", content: review.valoracion_personal, icon: Heart }
  ];

  // Añadir Galería a la navegación si hay imágenes
  const navSections = review?.imagenes && review.imagenes.length > 0 
    ? [...sections, { title: "Galería", content: null, icon: Camera }]
    : sections;

  // Función helper para manejar navegación sin ocultar el nav-bar
  const handleNavClick = (sectionId: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true); // Bloquear auto-hide durante navegación
    setAllowAutoHide(false); // Bloquear auto-hide hasta que el usuario haga scroll manual (wheel/touch)
    
    const element = document.getElementById(sectionId);
    if (element) {
      const header = document.querySelector('header');
      const navBar = document.getElementById('section-nav-bar');
      const headerHeight = header?.offsetHeight || 64;
      const navBarHeight = navBar?.offsetHeight || 0;
      const margin = 8;
      const totalOffset = headerHeight + navBarHeight + margin;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      
      window.scrollTo({ top: elementPosition - totalOffset, behavior: 'smooth' });
      
      // Desbloquear isNavigating después de la animación de scroll
      setTimeout(() => setIsNavigating(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isNavigating={isNavigating} allowAutoHide={allowAutoHide} />
      
      <main className="container mx-auto px-4 py-6 sm:py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 sm:mb-6 hover:bg-primary/10 min-h-[44px] touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Reviews
        </Button>

        {/* Hero Section */}
        <div className="relative mb-6 sm:mb-8">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="h-48 sm:h-56 md:h-64 lg:h-80 bg-muted flex items-center justify-center">
              <img 
                src={review.image} 
                alt={review.title}
                loading="eager"
                fetchPriority="high"
                className="w-full h-full object-cover object-center"
                style={{ objectPosition: 'center 30%' }}
              />
            </div>
            
            <div className="p-4 sm:p-6">
              {/* Header: Title + Interaction Buttons */}
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-3 sm:mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs sm:text-sm">Reseña</Badge>
                    <div className="flex items-center gap-1">
                      {renderGamepads(review.rating)}
                      <span className="text-xs sm:text-sm font-semibold ml-1 text-accent">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">
                    {review.title}
                  </h1>
                </div>

                {/* Interaction Buttons - Now at title level */}
                <div className="flex flex-col gap-2 min-w-[280px] lg:mt-8">
                  {/* Like/Dislike Row */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={userVote === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVote(true)}
                      disabled={voteLoading}
                      className={`flex items-center justify-center gap-2 min-h-[44px] touch-manipulation w-full transition-all ${
                        userVote === true 
                          ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500' 
                          : 'text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 hover:border-emerald-500 active:scale-95'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">Me gusta</span>
                      <span className="font-semibold">({stats.likes_count})</span>
                    </Button>

                    <Button
                      variant={userVote === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVote(false)}
                      disabled={voteLoading}
                      className={`flex items-center justify-center gap-2 min-h-[44px] touch-manipulation w-full transition-all ${
                        userVote === false 
                          ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
                          : 'text-red-600 hover:text-red-700 hover:bg-red-500/10 hover:border-red-500 active:scale-95'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span className="text-xs sm:text-sm">No me gusta</span>
                      <span className="font-semibold">({stats.dislikes_count})</span>
                    </Button>
                  </div>

                  {/* Comment Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/review/${id}/comments`)}
                    className="flex items-center justify-center gap-2 min-h-[44px] touch-manipulation w-full text-primary hover:text-primary hover:bg-primary/10 hover:border-primary transition-all active:scale-95"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Deja un comentario</span>
                    <span className="font-semibold">({stats.comments_count})</span>
                  </Button>
                </div>
              </div>
              
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{review.author}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{review.publishDate}</span>
                </div>
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>{stats.views_count} visitas</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Bar for Sections - Responsive: 1 línea en desktop, 2 líneas compactas en móvil */}
        <div id="section-nav-bar" className={`mb-6 sm:mb-8 sticky top-16 z-40 bg-background/95 backdrop-blur-sm border-y border-border py-0.5 sm:py-4 -mx-4 px-4 transition-transform duration-300 ${
          scrollDirection === 'down' && navBarPassed && !isNavigating && allowAutoHide ? '-translate-y-[calc(100%+4rem)]' : 'translate-y-0'
        }`}>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-0 md:gap-4 lg:gap-6">
            {/* Primera fila */}
            <a
              href="#introducción"
              className="text-primary hover:text-accent transition-colors font-medium text-xs sm:text-sm md:text-base flex items-center gap-1 touch-manipulation py-1"
              onClick={handleNavClick('introducción')}
            >
              Introducción
            </a>
            <a
              href="#argumento"
              className="text-primary hover:text-accent transition-colors font-medium text-xs sm:text-sm md:text-base flex items-center gap-1 touch-manipulation py-1"
              onClick={handleNavClick('argumento')}
            >
              Argumento
            </a>
            <a
              href="#gameplay"
              className="text-primary hover:text-accent transition-colors font-medium text-xs sm:text-sm md:text-base flex items-center gap-1 touch-manipulation py-1"
              onClick={handleNavClick('gameplay')}
            >
              Gameplay
            </a>
            <a
              href="#funciones"
              className="text-primary hover:text-accent transition-colors font-medium text-xs sm:text-sm md:text-base flex items-center gap-1 touch-manipulation py-1"
              onClick={handleNavClick('funciones')}
            >
              Funciones
            </a>
            
            {/* Forzar salto de línea solo en móvil */}
            <div className="basis-full h-0 md:hidden"></div>
            
            {/* Segunda fila */}
            <a
              href="#duración"
              className="text-primary hover:text-accent transition-colors font-medium text-xs sm:text-sm md:text-base flex items-center gap-1 touch-manipulation py-1"
              onClick={handleNavClick('duración')}
            >
              Duración
            </a>
            <a
              href="#valoración-personal"
              className="text-primary hover:text-accent transition-colors font-medium text-xs sm:text-sm md:text-base flex items-center gap-1 touch-manipulation py-1"
              onClick={handleNavClick('valoración-personal')}
            >
              Valoración
            </a>
            {review?.imagenes && review.imagenes.length > 0 && (
              <a
                href="#galería"
                className="text-primary hover:text-accent transition-colors font-medium text-xs sm:text-sm md:text-base flex items-center gap-1 touch-manipulation py-1"
                onClick={handleNavClick('galería')}
              >
                Galería
              </a>
            )}
          </nav>
        </div>

        {/* Review Sections */}
        <div className="grid gap-6">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            const isSpoilerSection = section.title === "Argumento" || section.title === "Valoración Personal";
            const sectionId = section.title.toLowerCase().replace(/\s+/g, '-');
            
            if (isSpoilerSection) {
              // Dividir el contenido usando el separador de spoilers (regex para detectar variaciones con espacios)
              const spoilerSeparatorRegex = /\s*---\s*A\s+PARTIR\s+DE\s+AQU[IÍ]\s*:\s*SPOILERS\s*---\s*/i;
              const hasSpoilers = section.content ? spoilerSeparatorRegex.test(section.content) : false;
              
              let initialText = '';
              let spoilerText = '';
              
              if (hasSpoilers && section.content) {
                const parts = section.content.split(spoilerSeparatorRegex);
                initialText = parts[0].trim();
                spoilerText = parts[1]?.trim() || '';
              } else {
                // Si no hay separador, mostrar todo el contenido sin sección de spoilers
                initialText = section.content || '';
              }
              
              return (
                <Card key={section.title} id={sectionId} className="border-border scroll-mt-[140px]">
                  <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-foreground">
                      <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      {section.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    {/* Texto inicial sin spoilers */}
                    {initialText && (
                      <div className="text-sm sm:text-base md:text-base text-muted-foreground mb-4 sm:mb-6 leading-relaxed">
                        {formatTextWithLineBreaks(initialText)}
                      </div>
                    )}
                    
                    {/* Sección de spoilers */}
                    {spoilerText && (
                      <Collapsible 
                        open={openSpoilers[section.title]} 
                        onOpenChange={(open) => setOpenSpoilers(prev => ({ ...prev, [section.title]: open }))}
                      >
                        <div className="bg-muted/30 border border-muted rounded-lg p-3 mb-3 sm:mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground">Contenido con spoilers</span>
                          </div>
                          <p className="text-muted-foreground text-xs mb-2 sm:mb-3">
                            Esta sección contiene detalles de la trama.
                          </p>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-xs h-9 sm:h-10 px-3 text-muted-foreground hover:text-foreground touch-manipulation">
                              <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${openSpoilers[section.title] ? 'rotate-180' : ''}`} />
                              {openSpoilers[section.title] ? 'Ocultar spoilers' : 'Mostrar spoilers'}
                            </Button>
                          </CollapsibleTrigger>
                        </div>
                        
                        <CollapsibleContent className="space-y-4">
                          <div className="text-sm sm:text-base md:text-base text-muted-foreground leading-relaxed">
                            {formatTextWithLineBreaks(spoilerText)}
                          </div>
                          
                          {/* Aviso persistente de spoilers cuando está abierto */}
                          <div className="bg-muted/20 border border-muted rounded-lg p-2 mt-4">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">Contenido con spoilers mostrado</span>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )}
                  </CardContent>
                </Card>
              );
            }
            
            return (
              <Card key={section.title} id={sectionId} className="border-border scroll-mt-[140px]">
                <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-foreground">
                    <IconComponent className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                  <div className="text-sm sm:text-base md:text-base text-muted-foreground leading-relaxed">
                    {formatTextWithLineBreaks(section.content)}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gallery (Images + Video) */}
        {galleryItems.length > 0 && (
          <Card id="galería" className="border-border mt-6 sm:mt-8 scroll-mt-[140px]">
            <CardHeader className="px-4 sm:px-6 py-4 sm:py-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl text-foreground">
                <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Galería
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {(galleryExpanded ? galleryItems : galleryItems.slice(0, 2)).map((item, index) => (
                  <div 
                    key={index} 
                    className="relative group overflow-hidden rounded-lg cursor-pointer touch-manipulation"
                    onClick={() => {
                      setCurrentImageIndex(index);
                      setLightboxOpen(true);
                    }}
                  >
                    {item.type === 'image' ? (
                      <>
                        <img 
                          src={item.url} 
                          alt={`Captura del juego ${index + 1}`}
                          loading="lazy"
                          className="w-full h-40 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                          <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-full h-40 sm:h-48 bg-muted flex items-center justify-center relative">
                          {isYouTubeVideo(item.url) && getYouTubeVideoId(item.url) ? (
                            <img 
                              src={`https://img.youtube.com/vi/${getYouTubeVideoId(item.url)}/hqdefault.jpg`}
                              alt="Video thumbnail"
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Video className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="bg-primary/90 rounded-full p-3 sm:p-4 group-hover:scale-110 transition-transform">
                              <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white fill-white" />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
                {!galleryExpanded && galleryItems.length > 2 && (
                  <div 
                    className="relative group overflow-hidden rounded-lg cursor-pointer h-40 sm:h-48 bg-muted/50 backdrop-blur-sm flex items-center justify-center touch-manipulation"
                    onClick={() => setGalleryExpanded(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/80 flex flex-col items-center justify-center gap-2 sm:gap-3 text-white">
                      <Eye className="h-10 w-10 sm:h-12 sm:w-12" />
                      <p className="text-lg sm:text-xl font-semibold">Ver más</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">+{galleryItems.length - 2} elementos</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lightbox Modal */}
        {lightboxOpen && galleryItems.length > 0 && (
          <div 
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close Button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-accent transition-colors z-50 p-2 touch-manipulation"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6 sm:h-8 sm:w-8" />
            </button>

            {/* Previous Button - Hidden on mobile, use swipe instead */}
            {currentImageIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageDirection('left');
                  setTimeout(() => {
                    setCurrentImageIndex(prev => prev - 1);
                    setImageDirection(null);
                  }, 100);
                }}
                className="hidden sm:block absolute left-2 sm:left-4 text-white hover:text-accent transition-colors z-50 p-2 touch-manipulation"
                aria-label="Anterior"
              >
                <ChevronLeft className="h-8 w-8 sm:h-12 sm:w-12" />
              </button>
            )}

            {/* Next Button - Hidden on mobile, use swipe instead */}
            {currentImageIndex < galleryItems.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setImageDirection('right');
                  setTimeout(() => {
                    setCurrentImageIndex(prev => prev + 1);
                    setImageDirection(null);
                  }, 100);
                }}
                className="hidden sm:block absolute right-2 sm:right-4 text-white hover:text-accent transition-colors z-50 p-2 touch-manipulation"
                aria-label="Siguiente"
              >
                <ChevronRight className="h-8 w-8 sm:h-12 sm:w-12" />
              </button>
            )}

            {/* Media Container with Slide Animation and Touch Support */}
            <div 
              className="max-w-7xl max-h-[90vh] w-full flex flex-col items-center justify-center overflow-hidden p-2 sm:p-4"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              {!galleryItems[currentImageIndex] ? (
                <div className="text-white text-center p-8 rounded-lg">
                  <p className="text-xl">No hay contenido disponible</p>
                </div>
              ) : galleryItems[currentImageIndex].type === 'image' ? (
                <img
                  key={currentImageIndex}
                  src={galleryItems[currentImageIndex].url}
                  alt={`Captura del juego ${currentImageIndex + 1}`}
                  className={`max-w-full max-h-[90vh] object-contain rounded-lg transition-all duration-500 ${
                    imageDirection === 'right' 
                      ? 'animate-slide-in-right' 
                      : imageDirection === 'left' 
                      ? 'animate-slide-in-left'
                      : ''
                  }`}
                />
              ) : galleryItems[currentImageIndex].type === 'video' ? (
                <div className={`w-full max-w-3xl sm:max-w-5xl transition-all duration-500 ${
                  imageDirection === 'right' 
                    ? 'animate-slide-in-right' 
                    : imageDirection === 'left' 
                    ? 'animate-slide-in-left'
                    : ''
                }`}>
                  {(() => {
                    const videoUrl = galleryItems[currentImageIndex].url;
                    const videoId = getYouTubeVideoId(videoUrl);
                    
                    if (videoId) {
                      // Es un video de YouTube
                      return (
                        <div className="relative w-full bg-black rounded-lg" style={{ paddingBottom: '56.25%' }}>
                          <iframe
                            key={currentImageIndex}
                            className="absolute top-0 left-0 w-full h-full rounded-lg"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&enablejsapi=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>
                      );
                    } else {
                      // Es un video directo
                      return (
                        <video
                          key={currentImageIndex}
                          controls
                          playsInline
                          className="w-full max-h-[70vh] sm:max-h-[90vh] rounded-lg"
                        >
                          <source src={videoUrl} type="video/mp4" />
                          Tu navegador no soporta la reproducción de videos.
                        </video>
                      );
                    }
                  })()}
                </div>
              ) : (
                <div className="text-white text-center p-8 rounded-lg">
                  <p className="text-xl">Tipo de contenido no soportado</p>
                </div>
              )}
            </div>

            {/* Media Counter */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 text-white text-xs sm:text-sm bg-black/70 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full backdrop-blur-sm">
              {currentImageIndex + 1} / {galleryItems.length}
            </div>

            {/* Swipe Indicator (only on mobile) */}
            <div className="sm:hidden absolute bottom-16 left-1/2 transform -translate-x-1/2 text-white/60 text-xs text-center">
              ← Desliza para navegar →
            </div>
          </div>
        )}

        {/* More Reviews Call to Action */}
        <div className="mt-8 sm:mt-12">
          <Card className="border-border">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-foreground">
                  Descubre más análisis
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
                  Explora nuestras reseñas detalladas de los mejores videojuegos
                </p>
                <Button 
                  variant="gaming" 
                  size="lg"
                  onClick={() => navigate('/reviews')}
                  className="flex items-center gap-2 min-h-[48px] touch-manipulation text-sm sm:text-base mt-2"
                >
                  <Gamepad2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  Ver Más Reviews
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ReviewDetail;