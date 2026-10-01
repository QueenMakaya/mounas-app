import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/dessins — "Donne vie à mon dessin".
 *
 * Body: { image: string }  — a JPEG (base64, no data: prefix), already
 * downscaled in the browser to ≤ 768px so the request stays small.
 *
 * Claude looks at the child's drawing and returns a name, a tiny French story
 * read aloud to the child, and how the drawing should move on screen.
 * Needs ANTHROPIC_API_KEY on the deployment; without it the page falls back to
 * a parent-typed name and a template story, so it still works.
 */

export const maxDuration = 60;

const MOVEMENTS = ['sauter', 'voler', 'nager', 'danser', 'marcher'] as const;
const DECORS = ['prairie', 'ciel', 'mer', 'espace', 'savane'] as const;

export type DessinMagic = {
  nom: string;
  quoi: string;
  histoire: string;
  phrase: string;
  mouvement: (typeof MOVEMENTS)[number];
  decor: (typeof DECORS)[number];
};

const SCHEMA = {
  type: 'object',
  properties: {
    nom: { type: 'string', description: 'Un prénom rigolo et doux pour le personnage (1 à 3 mots).' },
    quoi: { type: 'string', description: 'Ce que représente le dessin, en 2 à 6 mots (ex. « un chat qui sourit »).' },
    histoire: {
      type: 'string',
      description: 'Une mini-histoire en français pour un enfant de 3 à 6 ans : 3 ou 4 phrases courtes, joyeuses, au présent.',
    },
    phrase: {
      type: 'string',
      description: 'Ce que dit le personnage quand on le touche : une phrase très courte (max 8 mots), à la première personne.',
    },
    mouvement: { type: 'string', enum: MOVEMENTS },
    decor: { type: 'string', enum: DECORS },
  },
  required: ['nom', 'quoi', 'histoire', 'phrase', 'mouvement', 'decor'],
  additionalProperties: false,
};

const SYSTEM = `Tu es la conteuse des Mounas, une app d’éveil pour les enfants de 0 à 6 ans (français, culture afro).
Un enfant vient de dessiner quelque chose. Regarde le dessin avec bienveillance : c’est souvent abstrait, des gribouillis comptent aussi.
Devine ce que c’est (ou invente une créature magique si c’est difficile à dire) et donne-lui vie.
Règles :
- Français simple, phrases courtes, vocabulaire d’un enfant de 4 ans.
- Toujours positif et tendre. Jamais de peur, de danger, de tristesse, ni de moquerie sur le dessin.
- L’histoire peut avoir une touche de culture afro (baobab, marché, tam-tam, savane, grand-mère qui raconte) quand ça s’y prête, sans forcer.
- Choisis le mouvement qui va le mieux (un oiseau vole, un poisson nage, un humain danse ou marche, une balle saute…) et le décor assorti.`;

export async function POST(request: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'not_configured' }, { status: 503 });
  }

  let image = '';
  try {
    const body = (await request.json()) as { image?: unknown };
    image = typeof body.image === 'string' ? body.image : '';
  } catch {
    /* fall through */
  }
  // ~1.5 MB of base64 is plenty for a 768px JPEG.
  if (!image || image.length > 2_000_000 || !/^[A-Za-z0-9+/=]+$/.test(image)) {
    return Response.json({ error: 'bad_image' }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'low',
        format: { type: 'json_schema', schema: SCHEMA },
      },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
            { type: 'text', text: 'Voici le dessin. Donne-lui vie !' },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return Response.json({ error: 'refused' }, { status: 422 });
    }

    const text = response.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') {
      return Response.json({ error: 'empty' }, { status: 502 });
    }
    const magic = JSON.parse(text.text) as DessinMagic;
    if (!MOVEMENTS.includes(magic.mouvement)) magic.mouvement = 'sauter';
    if (!DECORS.includes(magic.decor)) magic.decor = 'prairie';
    return Response.json(magic);
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: 'busy' }, { status: 429 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error('[dessins] Claude API error', error.status, error.message);
      return Response.json({ error: 'api_error' }, { status: 502 });
    }
    console.error('[dessins] unexpected error', error);
    return Response.json({ error: 'unexpected' }, { status: 500 });
  }
}
