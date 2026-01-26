// Mock data para previsualizar reseñas localmente sin Supabase
// Importar los archivos JSON de las reseñas
import tlou2Data from '../../reviews/the-last-of-us-2.json';
import clairObscurData from '../../reviews/clair-obscur-expedition-33.json';
import xcom2Data from '../../reviews/xcom2.json';

export const mockReviews = [
  {
    id: tlou2Data.slug,
    slug: tlou2Data.slug,
    title: tlou2Data.title,
    game_title: tlou2Data.game_title,
    genre: tlou2Data.genre,
    rating: tlou2Data.rating,
    publish_date: tlou2Data.publish_date,
    author: tlou2Data.author,
    image_url: tlou2Data.image_url,
    introduccion: tlou2Data.introduccion,
    argumento: tlou2Data.argumento,
    gameplay: tlou2Data.gameplay,
    funciones: tlou2Data.funciones,
    duracion: tlou2Data.duracion,
    valoracion_personal: tlou2Data.valoracion_personal,
    imagenes: tlou2Data.imagenes,
    video_url: (tlou2Data as any).video_url || null,
    comments_count: 0,
    likes_count: 0,
    dislikes_count: 0,
    views_count: 0
  },
  {
    id: clairObscurData.slug,
    slug: clairObscurData.slug,
    title: clairObscurData.title,
    game_title: clairObscurData.game_title,
    genre: clairObscurData.genre,
    rating: clairObscurData.rating,
    publish_date: clairObscurData.publish_date,
    author: clairObscurData.author,
    image_url: clairObscurData.image_url,
    introduccion: clairObscurData.introduccion,
    argumento: clairObscurData.argumento,
    gameplay: clairObscurData.gameplay,
    funciones: clairObscurData.funciones,
    duracion: clairObscurData.duracion,
    valoracion_personal: clairObscurData.valoracion_personal,
    imagenes: clairObscurData.imagenes,
    video_url: (clairObscurData as any).video_url || null,
    comments_count: 0,
    likes_count: 0,
    dislikes_count: 0,
    views_count: 0
  }
  ,
  {
    id: xcom2Data.slug,
    slug: xcom2Data.slug,
    title: xcom2Data.title,
    game_title: xcom2Data.game_title,
    genre: xcom2Data.genre,
    rating: xcom2Data.rating,
    publish_date: xcom2Data.publish_date,
    author: xcom2Data.author,
    image_url: xcom2Data.image_url,
    introduccion: xcom2Data.introduccion,
    argumento: xcom2Data.argumento,
    gameplay: xcom2Data.gameplay,
    funciones: xcom2Data.funciones,
    duracion: xcom2Data.duracion,
    valoracion_personal: xcom2Data.valoracion_personal,
    imagenes: xcom2Data.imagenes,
    video_url: (xcom2Data as any).video_url || null,
    comments_count: 0,
    likes_count: 0,
    dislikes_count: 0,
    views_count: 0
  }
];

// Variable para activar/desactivar el modo desarrollo
export const USE_MOCK_DATA = true;
