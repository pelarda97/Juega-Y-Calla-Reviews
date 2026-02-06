import { useState, useEffect } from "react";
import { Search, Filter, Calendar, Star, TrendingUp, ChevronDown } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReviewCard from "@/components/ReviewCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { mockReviews, USE_MOCK_DATA } from "@/data/mockReviews";

const Reviews = () => {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState(searchParams.get("sort") || "date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [genreFilter, setGenreFilter] = useState("all");
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    // Leer parámetro sort de la URL
    const sortParam = searchParams.get("sort");
    if (sortParam) {
      setSortBy(sortParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      
      // Si USE_MOCK_DATA está activado, usar datos locales
      if (USE_MOCK_DATA) {
        const reviewsWithExcerpt = mockReviews.map(review => {
          let excerptText = "";
          if (review.slug === "god-of-war-ragnarok" && review.argumento) {
            const afterFirstBreak = review.argumento.split("\n\n")[1] || review.argumento;
            excerptText = afterFirstBreak.substring(0, 150) + "...";
          } else {
            excerptText = review.argumento?.substring(0, 150) + "..." || review.introduccion?.substring(0, 150) + "..." || "";
          }
          
          return {
          id: review.slug,
          title: review.title,
          genre: review.genre || "Sin género",
          rating: review.rating,
          date: review.publish_date,
          author: review.author,
          excerpt: excerptText,
          image: review.image_url || "/placeholder.svg",
          comments: review.comments_count || 0,
          likes: review.likes_count || 0,
          dislikes: review.dislikes_count || 0,
          views: review.views_count || 0,
          featured: false
        };
        });
        
        setReviews(reviewsWithExcerpt);
        
        // Extraer géneros únicos, dividiendo por comas si hay múltiples géneros
        const allGenres = mockReviews
          .map(r => r.genre)
          .filter(Boolean)
          .flatMap(genre => genre.split(',').map(g => g.trim()));
        const uniqueGenres = [...new Set(allGenres)];
        setGenres(uniqueGenres as string[]);
        setLoading(false);
        return;
      }
      
      // Si no, intentar cargar desde Supabase
      // Optimizado: solo columnas necesarias (reduce egress ~80%)
      const { data, error } = await supabase
        .from("reviews")
        .select("slug, title, genre, rating, publish_date, author, image_url, likes_count, dislikes_count, comments_count, views_count, argumento, introduccion")
        .order("publish_date", { ascending: false });

      if (error) throw error;

      if (data) {
        // Extraer los primeros 150 caracteres de argumento como excerpt
        const reviewsWithExcerpt = data.map(review => {
          let excerptText = "";
          if (review.slug === "god-of-war-ragnarok" && review.argumento) {
            const afterFirstBreak = review.argumento.split("\n\n")[1] || review.argumento;
            excerptText = afterFirstBreak.substring(0, 150) + "...";
          } else {
            excerptText = review.argumento?.substring(0, 150) + "..." || review.introduccion?.substring(0, 150) + "..." || "";
          }
          
          return {
          id: review.slug,
          title: review.title,
          genre: review.genre || "Sin género",
          rating: review.rating,
          date: review.publish_date,
          author: review.author,
          excerpt: excerptText,
          image: review.image_url || "/placeholder.svg",
          comments: review.comments_count || 0,
          likes: review.likes_count || 0,
          dislikes: review.dislikes_count || 0,
          views: review.views_count || 0,
          featured: false
        };
        });
        
        setReviews(reviewsWithExcerpt);

        // Extraer géneros únicos para el filtro, dividiendo por comas si hay múltiples géneros
        const allGenres = data
          .map(r => r.genre)
          .filter(Boolean)
          .flatMap(genre => genre.split(',').map(g => g.trim()));
        const uniqueGenres = [...new Set(allGenres)];
        setGenres(uniqueGenres as string[]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Error al cargar reseñas:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review => {
    // Búsqueda por palabras que empiecen con el término (no letras sueltas en medio)
    const searchLower = searchTerm.toLowerCase().trim();
    const titleWords = review.title.toLowerCase().split(/\s+/);
    const genreWords = review.genre.toLowerCase().split(/\s+/);
    
    const matchesSearch = searchTerm === "" || 
      titleWords.some(word => word.startsWith(searchLower)) ||
      genreWords.some(word => word.startsWith(searchLower));
    
    // Dividir géneros por coma y verificar si alguno coincide con el filtro
    const reviewGenres = review.genre.split(',').map(g => g.trim().toLowerCase());
    const matchesGenre = genreFilter === "all" || reviewGenres.includes(genreFilter.toLowerCase());
    return matchesSearch && matchesGenre;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case "date":
        // Parsear fechas correctamente (formato: "DD de Mes de YYYY")
        const parseDate = (dateStr: string) => {
          const months: { [key: string]: number } = {
            "enero": 0, "febrero": 1, "marzo": 2, "abril": 3, "mayo": 4, "junio": 5,
            "julio": 6, "agosto": 7, "septiembre": 8, "octubre": 9, "noviembre": 10, "diciembre": 11
          };
          const parts = dateStr.toLowerCase().split(" de ");
          if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = months[parts[1].trim()];
            const year = parseInt(parts[2]);
            return new Date(year, month, day).getTime();
          }
          return new Date(dateStr).getTime();
        };
        comparison = parseDate(b.date) - parseDate(a.date);
        break;
      case "rating":
        comparison = b.rating - a.rating;
        break;
      case "popularity":
        // Popularidad = likes + visitas (ponderado)
        const popularityA = (a.likes * 2) + a.views;
        const popularityB = (b.likes * 2) + b.views;
        comparison = popularityB - popularityA;
        break;
      case "title":
        comparison = a.title.localeCompare(b.title);
        break;
      default:
        comparison = 0;
    }
    
    // Invertir si la dirección es ascendente
    return sortDirection === "desc" ? comparison : -comparison;
  });

  // Handler para cambiar ordenamiento
  const handleSortChange = (newSortBy: string) => {
    if (newSortBy === sortBy) {
      // Si es el mismo filtro, invertir dirección
      setSortDirection(prev => prev === "desc" ? "asc" : "desc");
    } else {
      // Si es diferente, cambiar filtro y establecer dirección por defecto
      setSortBy(newSortBy);
      setSortDirection(newSortBy === "title" ? "asc" : "desc");
    }
  };

  // Obtener etiqueta descriptiva del filtro actual
  const getCurrentSortLabel = () => {
    const labels: { [key: string]: string } = {
      date: "Fecha",
      rating: "Puntuación",
      popularity: "Popularidad",
      title: "Título A-Z"
    };
    const directionSymbol = sortDirection === "desc" ? " ↓" : " ↑";
    return labels[sortBy] + directionSymbol;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header Section */}
      <section className="bg-gradient-to-r from-primary/20 to-accent/20 py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4">
              Todas las Reseñas
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground mb-6 sm:mb-8 px-2">
              Encuentra la información que necesitas antes de tu próxima compra
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mt-8 sm:mt-12">
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-border touch-manipulation">
                <div className="text-xl sm:text-2xl font-bold text-accent">{reviews.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Reseñas Totales</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-border touch-manipulation">
                <div className="text-xl sm:text-2xl font-bold text-accent">{genres.length}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">Géneros</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-border touch-manipulation">
                <div className="text-xl sm:text-2xl font-bold text-accent">
                  {reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "0.0"}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Puntuación Media</div>
              </div>
              <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-border touch-manipulation">
                <div className="text-xl sm:text-2xl font-bold text-accent">
                  {(() => {
                    const totalLikes = reviews.reduce((sum, r) => sum + (r.likes || 0), 0);
                    const totalDislikes = reviews.reduce((sum, r) => sum + (r.dislikes || 0), 0);
                    const total = totalLikes + totalDislikes;
                    return total > 0 ? `${Math.round((totalLikes / total) * 100)}%` : "0%";
                  })()}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Valoración Positiva</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-6 sm:py-8 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 items-end">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Buscar por título..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 min-h-[44px] touch-manipulation text-base"
                  />
                </div>
              </div>

              {/* Genre Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Género</label>
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger className="min-h-[44px] touch-manipulation">
                    <SelectValue placeholder="Todos los géneros" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los géneros</SelectItem>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre.toLowerCase()} className="min-h-[44px]">
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ordenar por</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full min-h-[44px] touch-manipulation justify-between"
                    >
                      <span>{getCurrentSortLabel()}</span>
                      <ChevronDown className="h-4 w-4 ml-2 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[200px]">
                    <DropdownMenuItem
                      onClick={() => handleSortChange("date")}
                      className="min-h-[44px] cursor-pointer"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Fecha
                      {sortBy === "date" && <span className="ml-auto">{sortDirection === "desc" ? "↓" : "↑"}</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortChange("rating")}
                      className="min-h-[44px] cursor-pointer"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Puntuación
                      {sortBy === "rating" && <span className="ml-auto">{sortDirection === "desc" ? "↓" : "↑"}</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortChange("popularity")}
                      className="min-h-[44px] cursor-pointer"
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Popularidad
                      {sortBy === "popularity" && <span className="ml-auto">{sortDirection === "desc" ? "↓" : "↑"}</span>}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleSortChange("title")}
                      className="min-h-[44px] cursor-pointer"
                    >
                      Título A-Z
                      {sortBy === "title" && <span className="ml-auto">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Clear Filters */}
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setGenreFilter("all");
                  setSortBy("date");
                  setSortDirection("desc");
                }}
                className="min-h-[44px] touch-manipulation"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </div>

            {/* Active Filters */}
            <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
              {searchTerm && (
                <Badge variant="secondary" className="gap-1 text-sm touch-manipulation">
                  Búsqueda: {searchTerm}
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="ml-1 hover:bg-background/20 rounded-full p-1 min-w-[24px] min-h-[24px] flex items-center justify-center"
                    aria-label="Eliminar filtro de búsqueda"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {genreFilter !== "all" && (
                <Badge variant="secondary" className="gap-1 text-sm touch-manipulation">
                  Género: {genreFilter}
                  <button 
                    onClick={() => setGenreFilter("all")}
                    className="ml-1 hover:bg-background/20 rounded-full p-1 min-w-[24px] min-h-[24px] flex items-center justify-center"
                    aria-label="Eliminar filtro de género"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Grid */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center py-12 sm:py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
                <p className="text-muted-foreground mt-4 text-sm sm:text-base">Cargando reseñas...</p>
              </div>
            ) : sortedReviews.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                {sortedReviews.map((review) => (
                  <ReviewCard key={review.id} {...review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 sm:py-16 px-4">
                <div className="text-5xl sm:text-6xl mb-4">🎮</div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  No se encontraron reseñas
                </h3>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Intenta ajustar tus filtros de búsqueda
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Reviews;