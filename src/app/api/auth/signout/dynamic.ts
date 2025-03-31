// Marcar esta ruta como dinámica para evitar la pre-renderización estática
// Esto es necesario porque podría usar cookies() en este componente
export const dynamic = 'force-dynamic'; 