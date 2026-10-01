import type { MetadataRoute } from 'next';

// Lets parents "Add to Home Screen" on a phone/tablet: the kids' app then opens
// full-screen, like a standalone app, straight on /app.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Les Mounas — Apprendre à lire',
    short_name: 'Les Mounas',
    description: 'Lire, écrire et donner vie à ses dessins — français + culture afro.',
    start_url: '/app',
    display: 'standalone',
    background_color: '#FDF6EC',
    theme_color: '#E63946',
    icons: [{ src: '/logo-mounas.png', sizes: 'any', type: 'image/png' }],
  };
}
