'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import DrawingCanvas, { type DrawingCanvasHandle } from '@/components/kid/DrawingCanvas';
import LivingStage, { type LivingStageHandle } from '@/components/kid/LivingStage';
import { fileToDataURL, makeCutout } from '@/lib/cutout';
import {
  deleteCreature,
  listCreatures,
  saveCreature,
  type Creature,
  type Decor,
  type Movement,
} from '@/lib/creatures-store';
import { sfx, speak, speakSequence, stopSpeaking } from '@/lib/speech';

type Screen = 'home' | 'draw' | 'magic' | 'creature' | 'world';

const MOVES: { id: Movement; label: string }[] = [
  { id: 'sauter', label: '🦘 Sauter' },
  { id: 'danser', label: '💃 Danser' },
  { id: 'marcher', label: '🚶 Marcher' },
  { id: 'voler', label: '🕊️ Voler' },
  { id: 'nager', label: '🐟 Nager' },
];

const DECORS: { id: Decor; label: string }[] = [
  { id: 'prairie', label: '🌼 Prairie' },
  { id: 'savane', label: '🌳 Savane' },
  { id: 'ciel', label: '🌈 Ciel' },
  { id: 'mer', label: '🐠 Mer' },
  { id: 'espace', label: '🪐 Espace' },
];

const PALETTE = ['#1A1A1A', '#E63946', '#F4A340', '#FFD23F', '#2D9B6F', '#2EC4B6', '#1D6FA4', '#5B1F8C', '#E6197A', '#8B5A2B'];

const MAGIC_LINES = ['La magie opère…', 'On souffle sur le papier…', 'Ton dessin se réveille…', 'Il ouvre les yeux…'];

const VERBS: Record<Movement, string> = {
  sauter: 'saute partout de joie',
  danser: 'danse au son du tam-tam',
  marcher: 'se promène pour dire bonjour à tout le monde',
  voler: 'vole au-dessus des nuages',
  nager: 'nage avec les poissons',
};

function fallbackStory(nom: string, mouvement: Movement): string {
  return `${nom} vient de naître sur une feuille de papier. Il ouvre les yeux et découvre Mounaville ! Aujourd’hui, ${nom} ${VERBS[mouvement]}. Et ce soir, il viendra faire un gros câlin à celle qui l’a dessiné.`;
}

const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export default function DessinsStudio() {
  const [screen, setScreen] = useState<Screen>('home');
  const [gallery, setGallery] = useState<Creature[]>([]);
  const [current, setCurrent] = useState<Creature | null>(null);
  const [magicLine, setMagicLine] = useState(0);
  const [needName, setNeedName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [storyIdx, setStoryIdx] = useState(-1);
  const [recording, setRecording] = useState(false);
  const [worldDecor, setWorldDecor] = useState<Decor>('prairie');
  const [error, setError] = useState('');

  const [penColor, setPenColor] = useState(PALETTE[1]);
  const [penSize, setPenSize] = useState(10);
  const drawRef = useRef<DrawingCanvasHandle>(null);
  const stageRef = useRef<LivingStageHandle>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const stopStory = useRef<(() => void) | null>(null);

  const refresh = useCallback(async () => setGallery(await listCreatures()), []);
  useEffect(() => {
    void listCreatures().then(setGallery);
    return () => stopSpeaking();
  }, []);

  useEffect(() => {
    if (screen !== 'magic') return;
    const id = setInterval(() => setMagicLine((i) => (i + 1) % MAGIC_LINES.length), 1400);
    return () => clearInterval(id);
  }, [screen]);

  const update = async (patch: Partial<Creature>) => {
    if (!current) return;
    const next = { ...current, ...patch };
    setCurrent(next);
    await saveCreature(next);
    void refresh();
  };

  const tellStory = (c: Creature | null = current) => {
    if (!c) return;
    stopStory.current?.();
    const sentences = c.histoire.match(/[^.!?…]+[.!?…]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [c.histoire];
    stopStory.current = speakSequence(sentences, {
      rate: 0.9,
      onStep: setStoryIdx,
      onDone: () => setStoryIdx(-1),
    });
  };

  /** From any picture (photo or in-app drawing) to a living creature. */
  const bringToLife = async (dataUrl: string) => {
    setError('');
    setScreen('magic');
    sfx.pop();
    try {
      const cut = await makeCutout(dataUrl);
      let magic: Partial<Creature> | null = null;
      try {
        const res = await fetch('/api/dessins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: cut.jpegForAI }),
        });
        if (res.ok) magic = (await res.json()) as Partial<Creature>;
      } catch {
        /* offline or not configured → the parent names it */
      }
      const mouvement = (magic?.mouvement as Movement) ?? 'sauter';
      const c: Creature = {
        id: uid(),
        createdAt: Date.now(),
        nom: magic?.nom || 'Mon dessin',
        quoi: magic?.quoi || '',
        histoire: magic?.histoire || fallbackStory('Mon dessin', mouvement),
        phrase: magic?.phrase || 'Coucou ! Merci de m’avoir dessiné !',
        mouvement,
        decor: (magic?.decor as Decor) ?? 'prairie',
        sprite: cut.sprite,
        framed: cut.framed,
        keepBackground: false,
      };
      await saveCreature(c);
      setCurrent(c);
      setNeedName(!magic);
      setNameDraft('');
      setScreen('creature');
      sfx.fanfare();
      void refresh();
      if (magic) setTimeout(() => tellStory(c), 900);
    } catch (e) {
      console.error(e);
      setError('Oups, on n’a pas réussi à lire cette image. Essaie une autre photo !');
      setScreen('home');
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    await bringToLife(await fileToDataURL(f));
  };

  const finishDrawing = async () => {
    if (!drawRef.current || drawRef.current.isEmpty()) return;
    await bringToLife(drawRef.current.toDataURL({ inkOnly: true }));
  };

  const confirmName = async () => {
    const nom = nameDraft.trim() || 'Mon dessin';
    const patch = { nom, histoire: fallbackStory(nom, current!.mouvement) };
    await update(patch);
    setNeedName(false);
    tellStory({ ...current!, ...patch });
  };

  const makeVideo = async () => {
    if (!stageRef.current) return;
    setRecording(true);
    if (current) tellStory();
    const file = await stageRef.current.record(8);
    setRecording(false);
    if (!file) {
      setError('Ton appareil ne sait pas enregistrer de vidéo ici. Fais plutôt une capture d’écran 📸');
      return;
    }
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: current ? `${current.nom} — Les Mounas` : 'Les Mounas' });
        return;
      } catch {
        /* cancelled — fall back to download */
      }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = file.name;
    a.click();
  };

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${active ? 'shadow-md' : ''}`;

  /* ─────────────── SCREENS ─────────────── */

  if (screen === 'magic') {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center" style={{ background: 'linear-gradient(160deg,#5B1F8C,#E6197A)' }}>
        <div className="text-8xl" style={{ animation: 'mounas-spin 2.4s ease-in-out infinite' }}>✨</div>
        <p className="text-3xl font-bold" style={{ color: '#FDF6EC', fontFamily: 'var(--font-fraunces)' }}>
          {MAGIC_LINES[magicLine]}
        </p>
        <p className="text-base" style={{ color: '#FDF6EC', opacity: 0.8 }}>Fais « abracadabra » avec tes mains !</p>
      </main>
    );
  }

  if (screen === 'draw') {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 py-4 sm:px-6" style={{ fontFamily: 'var(--font-read)' }}>
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setScreen('home')} className="text-sm font-bold" style={{ color: '#5B1F8C' }}>
            ← Retour
          </button>
          <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>✏️ Dessine ton personnage</h1>
          <span />
        </div>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {PALETTE.map((c) => (
            <button
              key={c}
              onClick={() => setPenColor(c)}
              className="h-10 w-10 rounded-full active:scale-90"
              style={{ backgroundColor: c, outline: penColor === c ? '3px solid #1A1A1A' : 'none', outlineOffset: 2 }}
              aria-label={`Couleur ${c}`}
            />
          ))}
          {[6, 10, 18].map((s) => (
            <button key={s} onClick={() => setPenSize(s)} className="flex h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: penSize === s ? '#F4A340' : '#FFFFFF' }}>
              <span className="rounded-full" style={{ width: s, height: s, backgroundColor: '#1A1A1A' }} />
            </button>
          ))}
          <button onClick={() => drawRef.current?.undo()} className="rounded-full px-4 py-2 text-sm font-bold" style={{ backgroundColor: '#FFFFFF' }}>
            ↶ Annuler
          </button>
          <button onClick={() => drawRef.current?.clear()} className="rounded-full px-4 py-2 text-sm font-bold" style={{ backgroundColor: '#FFFFFF' }}>
            🗑️
          </button>
        </div>
        <div className="overflow-hidden rounded-3xl shadow-md" style={{ border: '1px solid rgba(26,26,26,0.12)' }}>
          <DrawingCanvas ref={drawRef} height={480} paper="blanc" color={penColor} size={penSize} />
        </div>
        <div className="mt-4 flex justify-center">
          <button onClick={finishDrawing} className="rounded-full px-10 py-4 text-xl font-bold shadow-lg active:scale-95" style={{ backgroundColor: '#E6197A', color: '#FDF6EC' }}>
            ✨ Donne-lui vie !
          </button>
        </div>
      </main>
    );
  }

  if (screen === 'creature' && current) {
    const sentences = current.histoire.match(/[^.!?…]+[.!?…]*/g)?.map((s) => s.trim()).filter(Boolean) ?? [current.histoire];
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-3 py-4 sm:px-6" style={{ fontFamily: 'var(--font-read)' }}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            onClick={() => {
              stopStory.current?.();
              setScreen('home');
            }}
            className="text-sm font-bold"
            style={{ color: '#5B1F8C' }}
          >
            ← Mes dessins
          </button>
          <h1 className="text-center text-3xl font-bold sm:text-4xl" style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}>
            {current.nom}
          </h1>
          <span className="w-20" />
        </div>

        <LivingStage
          ref={stageRef}
          actors={[{ id: current.id, sprite: current.keepBackground ? current.framed : current.sprite, mouvement: current.mouvement }]}
          decor={current.decor}
          onTapActor={() => {
            sfx.boing();
            speak(current.phrase, { pitch: 1.4, rate: 1 });
          }}
        />
        <p className="mt-2 text-center text-sm" style={{ color: 'rgba(26,26,26,0.55)' }}>
          👆 Touche {current.nom} pour qu’il te parle !
        </p>

        {needName && (
          <form
            className="mx-auto mt-4 flex max-w-md flex-col items-center gap-3 rounded-3xl p-5 text-center"
            style={{ backgroundColor: '#FFFFFF', border: '2px dashed #F4A340' }}
            onSubmit={(e) => {
              e.preventDefault();
              void confirmName();
            }}
          >
            <p className="text-lg font-bold">Comment s’appelle ton personnage ?</p>
            <input
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Son prénom…"
              className="w-full rounded-full border px-5 py-3 text-center text-xl"
              style={{ borderColor: 'rgba(26,26,26,0.2)' }}
            />
            <button className="rounded-full px-6 py-3 font-bold" style={{ backgroundColor: '#E63946', color: '#FDF6EC' }}>
              C’est son nom ! ✨
            </button>
          </form>
        )}

        {/* STORY */}
        <section className="mt-4 rounded-3xl p-5" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>📖 Son histoire</h2>
            <button onClick={() => tellStory()} className="rounded-full px-5 py-2 font-bold shadow-sm active:scale-95" style={{ backgroundColor: '#5B1F8C', color: '#FDF6EC' }}>
              🔊 Raconte !
            </button>
          </div>
          <p className="text-xl leading-relaxed sm:text-2xl">
            {sentences.map((s, i) => (
              <span
                key={i}
                className="rounded-lg px-1 transition-colors"
                style={{ backgroundColor: storyIdx === i ? '#FFE8B0' : 'transparent' }}
              >
                {s}{' '}
              </span>
            ))}
          </p>
        </section>

        {/* CONTROLS */}
        <section className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(26,26,26,0.55)' }}>Il bouge comment ?</p>
            <div className="flex flex-wrap gap-2">
              {MOVES.map((m) => (
                <button key={m.id} onClick={() => void update({ mouvement: m.id })} className={chip(current.mouvement === m.id)} style={{ backgroundColor: current.mouvement === m.id ? '#F4A340' : '#FFFFFF' }}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(26,26,26,0.55)' }}>Il vit où ?</p>
            <div className="flex flex-wrap gap-2">
              {DECORS.map((d) => (
                <button key={d.id} onClick={() => void update({ decor: d.id })} className={chip(current.decor === d.id)} style={{ backgroundColor: current.decor === d.id ? '#2EC4B6' : '#FFFFFF' }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button onClick={makeVideo} disabled={recording} className="rounded-full px-6 py-3 font-bold shadow-md active:scale-95 disabled:opacity-60" style={{ backgroundColor: '#E63946', color: '#FDF6EC' }}>
            {recording ? '🔴 On filme… (8 s)' : '🎬 Faire une vidéo pour la famille'}
          </button>
          <button onClick={() => void update({ keepBackground: !current.keepBackground })} className="rounded-full px-5 py-3 text-sm font-bold" style={{ backgroundColor: '#FFFFFF' }}>
            {current.keepBackground ? '✂️ Enlever le papier' : '📄 Garder le papier'}
          </button>
          <button
            onClick={() => {
              const nom = window.prompt('Nouveau prénom ?', current.nom)?.trim();
              if (nom) void update({ nom });
            }}
            className="rounded-full px-5 py-3 text-sm font-bold"
            style={{ backgroundColor: '#FFFFFF' }}
          >
            ✏️ Renommer
          </button>
          <button
            onClick={async () => {
              if (!window.confirm(`Supprimer ${current.nom} ?`)) return;
              await deleteCreature(current.id);
              await refresh();
              setScreen('home');
            }}
            className="rounded-full px-5 py-3 text-sm font-bold"
            style={{ backgroundColor: '#FFFFFF', color: '#E63946' }}
          >
            🗑️
          </button>
        </div>
        {error && <p className="mt-3 text-center text-sm" style={{ color: '#E63946' }}>{error}</p>}
      </main>
    );
  }

  if (screen === 'world') {
    return (
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-4 sm:px-6" style={{ fontFamily: 'var(--font-read)' }}>
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => setScreen('home')} className="text-sm font-bold" style={{ color: '#5B1F8C' }}>← Mes dessins</button>
          <h1 className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'var(--font-fraunces)' }}>🌍 Tout le monde ensemble</h1>
          <span />
        </div>
        <LivingStage
          ref={stageRef}
          decor={worldDecor}
          actors={gallery.slice(0, 6).map((c) => ({ id: c.id, sprite: c.keepBackground ? c.framed : c.sprite, mouvement: c.mouvement }))}
          onTapActor={(id) => {
            const c = gallery.find((x) => x.id === id);
            if (!c) return;
            sfx.boing();
            speak(`${c.nom} ! ${c.phrase}`, { pitch: 1.4, rate: 1 });
          }}
        />
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {DECORS.map((d) => (
            <button key={d.id} onClick={() => setWorldDecor(d.id)} className={chip(worldDecor === d.id)} style={{ backgroundColor: worldDecor === d.id ? '#2EC4B6' : '#FFFFFF' }}>
              {d.label}
            </button>
          ))}
          <button onClick={makeVideo} disabled={recording} className="rounded-full px-5 py-2 text-sm font-bold disabled:opacity-60" style={{ backgroundColor: '#E63946', color: '#FDF6EC' }}>
            {recording ? '🔴 On filme…' : '🎬 Vidéo'}
          </button>
        </div>
      </main>
    );
  }

  /* HOME */
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6" style={{ fontFamily: 'var(--font-read)' }}>
      <div className="mb-2">
        <Link href="/app" className="text-sm font-bold" style={{ color: '#5B1F8C' }}>← Accueil</Link>
      </div>
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold sm:text-5xl" style={{ fontFamily: 'var(--font-fraunces)', color: '#1A1A1A' }}>
          🎨 Mes dessins vivants
        </h1>
        <p className="mt-2 text-lg" style={{ color: 'rgba(26,26,26,0.7)' }}>
          Montre-moi ton dessin… et regarde-le se réveiller !
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <button onClick={() => cameraInput.current?.click()} className="flex flex-col items-center gap-2 rounded-3xl p-6 text-center shadow-md transition active:scale-95" style={{ backgroundColor: '#E63946', color: '#FDF6EC' }}>
          <span className="text-6xl">📷</span>
          <span className="text-xl font-bold">Prendre en photo</span>
          <span className="text-sm opacity-85">Pose le dessin à plat, bien éclairé</span>
        </button>
        <button onClick={() => photoInput.current?.click()} className="flex flex-col items-center gap-2 rounded-3xl p-6 text-center shadow-md transition active:scale-95" style={{ backgroundColor: '#F4A340', color: '#1A1A1A' }}>
          <span className="text-6xl">🖼️</span>
          <span className="text-xl font-bold">Choisir une photo</span>
          <span className="text-sm opacity-75">Depuis la galerie</span>
        </button>
        <button onClick={() => setScreen('draw')} className="flex flex-col items-center gap-2 rounded-3xl p-6 text-center shadow-md transition active:scale-95" style={{ backgroundColor: '#2EC4B6', color: '#1A1A1A' }}>
          <span className="text-6xl">✏️</span>
          <span className="text-xl font-bold">Dessiner ici</span>
          <span className="text-sm opacity-75">Avec le doigt</span>
        </button>
      </div>
      <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onFile} />
      <input ref={photoInput} type="file" accept="image/*" hidden onChange={onFile} />
      {error && <p className="mt-4 text-center" style={{ color: '#E63946' }}>{error}</p>}

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-fraunces)' }}>Ma galerie</h2>
          {gallery.length > 1 && (
            <button onClick={() => setScreen('world')} className="rounded-full px-5 py-2 font-bold shadow-sm" style={{ backgroundColor: '#5B1F8C', color: '#FDF6EC' }}>
              🌍 Tous ensemble
            </button>
          )}
        </div>
        {gallery.length === 0 ? (
          <p className="rounded-3xl p-8 text-center" style={{ backgroundColor: '#FFFFFF', color: 'rgba(26,26,26,0.6)' }}>
            Pas encore de dessin vivant. Commence par une photo de ton plus beau dessin ! 🖍️
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {gallery.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setCurrent(c);
                  setNeedName(false);
                  setScreen('creature');
                }}
                className="flex flex-col items-center gap-2 rounded-3xl p-3 shadow-sm transition active:scale-95"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL */}
                <img src={c.sprite} alt={c.nom} className="h-28 w-full object-contain" style={{ animation: 'mounas-wiggle 2.5s ease-in-out infinite' }} />
                <span className="font-bold">{c.nom}</span>
              </button>
            ))}
          </div>
        )}
        <p className="mt-6 text-center text-xs" style={{ color: 'rgba(26,26,26,0.45)' }}>
          Les dessins restent sur cet appareil. Pour trouver un nom et une histoire, une petite copie de l’image est
          envoyée à notre conteuse (une IA) ; Les Mounas ne la gardent pas.
        </p>
      </section>
    </main>
  );
}
