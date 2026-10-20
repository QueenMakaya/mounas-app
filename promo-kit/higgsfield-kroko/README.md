# Higgsfield pilot: the Kroko reel

Goal: find out whether animated shots make a reel convert better than the current
slideshow reels. Same campaign (Kroko, "plus grand que / plus petit que"), same length
(~20 s), same caption, same offer. Only the video changes.

| File | What it is |
|---|---|
| `frames/shot_a.png`, `shot_b.png`, `shot_c.png` | Start images to upload to Higgsfield (9:16, no text) |
| `out/kroko_reel_higgsfield_preview.mp4` | The new reel with still images in place of the clips (layout, text and timing preview) |
| `out/kroko_reel_slideshow.mp4` | The current format, as the comparison (control) version |
| `build_frames.py` | Rebuilds the start images from the campaign cards |
| `make_reel.py` | Builds the final reel once the clips are in `clips/` |

## 1. Generate the 3 clips on higgsfield.ai

Use the **website**: on paid plans the unlimited generations only apply there, not to
the API or MCP.

For each shot: image-to-video, upload the start image, **9:16**, **5 seconds**, paste the
prompt. Start with Kling (cheaper); if Kroko loses his shape, try Seedance. Make 2 or 3
versions of each and keep the one where Kroko stays the same drawing and nothing new
appears (text, extra animals, a changed background).

Add this negative prompt (or the end of the prompt if there is no negative field):
`text, letters, numbers, watermark, extra characters, realistic, 3D, shading, gradient, background change, camera cut, morphing`

**Shot A: the hook** (`frames/shot_a.png`)
> Flat 2D vector cartoon animation. The green cartoon crocodile lunges down toward the
> bigger pile of red tomatoes on the left, opens its jaws wide and snaps them shut with a
> playful chomp, then bounces back happily. The small pile on the right stays still. Flat
> colors, no shading, the cream background stays exactly the same. Static camera with a
> slow push-in. Bouncy, joyful, kid-friendly cartoon motion.

**Shot B: the rule** (`frames/shot_b.png`)
> Flat 2D vector cartoon animation. The green cartoon crocodile stays in the center of the
> frame, facing left. It opens its jaws very wide toward the left, closes them, then opens
> them wide again with a happy little bounce, its tail wiggling. The crocodile does not
> move left or right. Flat colors, no shading, the cream background stays exactly the
> same. Static camera.

The 5 and the 2 are added on each side afterwards, so Kroko must stay in the middle.

**Shot C: Kroko's feast** (`frames/shot_c.png`)
> Flat 2D vector cartoon animation. The green cartoon crocodile hops down toward the
> fuller bowl on the left and takes a big happy bite, a few round golden seeds bounce up
> out of the bowl. The bowl on the right with fewer seeds stays still. Flat colors, no
> shading, the cream background stays exactly the same. Static camera with a slow push-in.

Download the chosen clips and send them back: they go in `clips/` as `shot_a.mp4`,
`shot_b.mp4`, `shot_c.mp4`, then `python3 make_reel.py`.

## 2. Optional: Pam's voice (recommended)

The reel works muted with the on-screen text, but a real voice usually holds attention
better. Record in one take, about 20 s, saved as `audio/vo.wav`; the music is lowered under it.

1. (0 s) « Ton enfant confond plus grand que et plus petit que ? Un crocodile règle ça. »
2. (5 s) « Kroko a toujours faim : sa bouche s'ouvre vers le plus grand. Cinq est plus grand que deux ! »
3. (10 s) « Le jeu des dix minutes : deux bols, des graines, et Kroko croque le bol le plus plein. »
4. (15 s) « Quatorze jours gratuits, le lien est dans la bio. »

## 3. The A/B test

- **Version A**: `out/kroko_reel_slideshow.mp4` (current format). **Version B**: `out/kroko_reel_higgsfield.mp4`.
- Same caption (below), same audio, same weekday and hour (e.g. Wednesday 10 h-12 h,
  your best slot), one week apart. If Instagram offers it, post both as **trial reels**:
  they are shown to non-followers first, which makes the comparison fairer.
- Compare after 7 days in Metricool / Instagram insights: views, **skip rate / 3-second
  views**, **average watch time**, shares and saves, profile visits, **link-in-bio clicks**,
  and new free trials that week.
- Read it as a signal, not a proof: one pair of reels is a small sample. If B clearly wins
  on watch time and clicks, run a second pair (e.g. « C'est quelle heure ? ») before
  changing the campaign skill.

Cost of version B: about 3 shots × 2-3 tries. That's included on the web plan, or roughly
$4-10 through the API.

### Caption (both versions)

> Ton enfant confond > et < ? 🐊 Kroko le crocodile a toujours faim : sa bouche s'ouvre
> toujours vers le plus grand nombre. Ce soir, essayez le festin de Kroko : 2 bols, des
> graines, 10 minutes.
>
> Une activité guidée chaque jour pour les 0-5 ans, en français, avec une âme afro.
> 14 jours gratuits : lien en bio (lesmounas.school/connect).
>
> #maths #maternelle #homeschool #apprendreenjouant #lesmounas
