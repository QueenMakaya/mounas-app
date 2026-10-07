import type { MetadataRoute } from 'next';

// Lets parents "Add to Home Screen" on a phone or tablet: the app then opens
// full-screen, like an installed app, straight on /app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Les Mounas — Apprendre à lire',
    short_name: 'Les Mounas',
    description: 'Le mot du jour en 10 minutes : lire, écrire et chanter en français, avec la culture afro.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#FDF6EC',
    theme_color: '#E63946',
    lang: 'fr',
    icons: [{ src: '/logo-mounas.png', sizes: 'any', type: 'image/png' }],
  };
}
