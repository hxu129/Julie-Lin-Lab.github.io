# Lin Lab redesign — Molecular Cartography

## Revision 2 — Image-led page rhythms

This revision supersedes the earlier all-page cartographic poster treatment. The shared paper/ink system remains, but each English core page now has a distinct content rhythm:

- **Home:** one restrained display-serif title, an un-tinted research figure, then a real laboratory group image.
- **Research:** a visual essay with three research figures at three different scales; headings are sans-serif.
- **Publications:** a compact chronological archive with one selected-paper image and dense citation rows.
- **People:** a single group photograph plus a text directory; no repeated avatar cards.
- **News:** a real-photo journal using existing laboratory and event images.
- **Join Us:** a quiet campus photograph and an application-information layout.

Typography is deliberately narrowed: the small wordmark may retain its display-serif character, while all page titles, section headings, selected-paper titles, and directory UI use Manrope. Existing repository images are used as content, not as tinted decorative texture. Generated layout mockups are planning references only; the separately generated field-note illustrations listed below are production assets and are never scientific evidence.

## Revision 3 — Field notes, not a figure wall

The release now follows a more legible visual contract, informed by contemporary research sites that let the work and current activity introduce the institution rather than front-loading institutional explanation. The visual language is a set of original, non-evidentiary field-note illustrations: graphite, muted blue, and minute copper marks on paper or midnight ink.

1. **Evidence and atmosphere stay separate.** Generated images are explicitly decorative and carry no result, experimental condition, person, project, or scientific conclusion. Event stories retain real source photography; individual profiles retain original portraits only where available.
2. **Reading is layered.** A research chapter opens with one exact source sentence. Its complete canonical statement remains available in a semantic `details` control, rather than being deleted or paraphrased.
3. **Every page has one job.** Home introduces research, a selected publication, current news, and the team; Research provides the programme; Publications remain a dense archive; People provides a navigable roster and coherent personal profiles.
4. **No visual claim inflation.** No AI image may resemble an experiment figure, microscopy result, molecular data panel, or factual laboratory photograph. No AI portrait is used for a lab member.
5. **One restrained image grammar.** Use cool paper, midnight ink, muted steel blue, and rare copper. No fluorescent palette, mCherry-like UI colour, neon biology, generic DNA helix, or glossy 3D render.
6. **Image quality is a performance budget.** Core rendered images use correctly sized WebP derivatives; original source files remain untouched. A sub-megabyte homepage media budget is preferable to a gallery of full-size JPEG/PNG downloads.
7. **A click must not leave the system.** English personal profile pages replace the legacy Colorlib shell with the same header, responsive menu, typography, art treatment, and footer as the redesigned site while preserving their original biographical content.

## Revision 4 — Real evidence stage

The accepted evidence-stage composition is a single dark, rounded editorial frame containing one unaltered real research image and one paper information panel. It is the only rounded major container in the system. Field-note art may frame the site, but it must yield to a real image when the page needs to demonstrate that laboratory work is happening.

- The real image retains its original colour channels; those colours are not promoted into interface tokens.
- The visible copy is restricted to an existing source-grounded statement of research systems and an image-credit line.
- No image title, channel identity, biological interpretation, disease label, model claim, experimental result, or project attribution is added until Ann confirms it.
- The stage appears on Home and Research to connect visual confidence with a path to the full canonical research description.

## Revision 5 — Publication figures as primary evidence

Publication imagery must be drawn from the paper record, not from decorative lab art. Each image receives a geometry selected from the scientific figure itself: a multi-panel figure remains complete inside a paper-sheet frame (`object-fit: contain`); a self-contained graphical abstract remains whole in a square frame. No panel is silently cropped merely to fill a visual container.

- The Home publication feature uses the existing repository EMBO mechanism figure at its natural square ratio, with a compact CC BY 4.0 credit.
- The Publications page presents the complete Figure 1 from the 2023 EMBO Journal article and the complete graphical abstract from the 2019 Cell article; both sources were checked as CC BY 4.0 before use.
- Captions link to the DOI and identify the figure type, journal, and license. They are attribution, not a new interpretation of the data.
- Publication layout uses a restrained paper field for the detailed multi-panel result and a separate midnight archive band for the graphical abstract, preventing page-to-page repetition while keeping one visual system.

## Revision 6 — Research image hierarchy

The Research page should not reuse the same generated illustration for every chapter. It now uses a deliberate progression: a credited external scientific image introduces the page without implying it is a Lin Lab result; Ann's supplied microscopy remains the only current laboratory evidence stage; an uncaptioned iPSC process montage is decorative visual material only; the technique chapter becomes an open text-led reading field rather than another image-and-text duplicate.

- `Growth_Cone_2.jpeg` contains its original credit to Dr William A. Harris and is presented whole, without an interface colour treatment or added scientific inference.
- The iPSC montage is the user-supplied visual material previously specified as decorative only. It has an empty alternative text and no added caption, title, condition, model, result, or claim.
- This removes one redundant generated figure, while retaining the remaining field-note illustrations as explicitly decorative atmosphere.

## Revision 7 — Reality-first Home

The Home hero is the appropriate final place to shift the site toward real imagery: it uses the full vertical Chiasm image, credited to Dr William A. Harris, rather than a generated illustration. Its portrait geometry is preserved with `object-fit: contain`; the source's own in-image credit remains visible. The three small Research-row field-note crops remain decorative navigation aids, while every major Home visual now has a distinct real role: scientific image, lab microscopy, paper figure, event photography, or team photo.

## Revision 8 — Lab archive imagery and quiet credits

The user has authorized all visual materials in `homepage_figure.zip` for site use. The Home hero now uses the archive's high-resolution `cut.jpg` derivative because its deep blue-green source palette supports the existing visual system without turning image-channel colours into UI colours. The smaller iPSC rail and Home hero use the same unobtrusive lower-right `Lin Lab image archive` credit treatment.

- The credit identifies source stewardship, not a named experiment, tissue, channel, organism, result, or claim.
- The original source images remain unaltered; web derivatives reduce transfer size only.
- This supersedes Revision 7's active Home-hero selection. The credited Chiasm image remains an approved reserve asset, not an active Home claim.

## Revision 9 — Archive atlas, not image wallpaper

The remaining visually distinctive, user-authorized materials from `homepage_figure.zip` are now given separate roles rather than being concentrated in a single hero or repeated as a gallery. This makes the English site feel materially connected to laboratory practice without turning the archive into asserted evidence.

- **Research** moves from process rail to three full, uncropped archive images: a spheroid image beside techniques, a magenta image on the dark regulation chapter, and a dual-channel image beside the health chapter. Their source channels stay inside the images; no fluorescent colour becomes interface chrome.
- **People** opens its group portrait with a small monochrome archive inset, while **Join Us** carries a light microscopy inset inside the contact block. These are visual atmosphere only, not a claim about a person, recruitment project, cell type, or result.
- All archive captions use the same small lower-right source label. The two identical iPSC process exports are intentionally represented once.

## Release content and asset contract

- `main` is the sole source of truth for visible research, publication, people, news, recruitment, and contact content. A visual re-layout may split source text into semantic HTML, but must not introduce a claim, omit a source fact, or paraphrase it into a different assertion.
- The user has authorized all imagery in `homepage_figure.zip` for visual use. Archive-derived images retain a small `Lin Lab image archive` credit and must not receive an added caption that asserts an experiment, tissue, channel, organism, result, or project claim.
- Existing source images may be re-cropped or reordered for visual hierarchy, but their placement must not imply a new result, project, affiliation, or event.
- Generated layout mockups are review references only. The three deployed `rna-field-notes-*.webp` illustrations are original decorative artwork; they must never be presented as research images, publication figures, experimental evidence, or scientific claims.

## Decision

Create a high-impact, evidence-led research site: **Molecular Cartography**. The site should feel like a contemporary science atlas: a precise RNA-to-synapse journey expressed through editorial typography, fine rules, diagrammatic pathways, and real research imagery. It must not become a generic university template, an AI-biotech landing page, or a neon science-fiction interface.

The focal question remains the laboratory's own established framing:

> Neuronal RNA Metabolism — From nucleus to synapse.

## Design thesis

- **Atlas first, evidence second, action third.** The homepage leads with a diagrammatic nucleus-to-synapse path, then resolves into research chapters, publications, and recruitment.
- **Use scientific material as the visual language.** Mechanism diagrams, axonal trajectories, and microscopy supply the subject matter; all interface geometry remains clearly editorial and non-data. Do not use generic double helices, stock laboratory photography, or invented research claims.
- **Paper is the default reading surface.** Use an archival warm white for long-form research, people, and publications; midnight ink is reserved for the journey, selected work, and recruitment sequence.
- **Cool through typography and composition, not effects.** Large editorial type, fine cartographic rules, a single continuous path, and image/citation juxtaposition are the signature moves. No carousels, bento grids, pills, glowing borders, or decorative statistics.
- **mCherry is data, not the brand.** Do not use mCherry magenta/red as an interface colour, hero tint, CTA field, or repeated decorative motif. If a paper image contains mCherry, preserve it only within the cited image itself.

## Information architecture

1. **Home**
   - Editorial hero: headline, one-sentence descriptor, a decorative-but-non-data RNA path, Research and Join Us actions.
   - Three cartographic research chapters: RNA Regulation, Local Translation, Disease Mechanisms.
   - Featured publication strip, direct People link without an avatar rail, dark recruitment sequence, footer.
2. **Research**
   - Three research chapters with full scientific imagery, brief plain-language framing, methods and representative papers.
   - A small data/technique rail only where it clarifies the work (synaptosome isolation, translatome profiling, iPSC-derived models).
3. **Publications**
   - A selected-paper editorial rail first; the full bibliography below by year/topic, rather than an undifferentiated wall of citations.
4. **People**
   - PI feature followed by consistently cropped person cards, role and research-interest tags, then detail pages.
5. **News and Join Us**
   - Clear chronological news list and an opportunity-first recruitment page; avoid burying eligibility information in prose.

## Visual system

| Role | Token | Use |
| --- | --- | --- |
| Paper | `#F5F1E8` | Default long-form surface and footer |
| Midnight ink | `#0A1C2C` | Hero, selected work, recruitment |
| Text ink | `#112438` | Headings and primary text on paper |
| Slate | `#637481` | Secondary text and rules |
| Cartographic blue | `#376A83` | Illustration, active navigation, path detail |
| Aged copper | `#A86B3D` | Rare figure marker and underlining detail only |
| mCherry and fluorescent colours | source-dependent | Preserved only in a cited research image; never repeated as UI accents |

- Typography: `DM Serif Display` only for the Home title and selected-paper title; `Manrope` for all other headings, body, and interface; `Source Serif 4` only for paper metadata/captions; and `Noto Sans SC` where Chinese appears.
- Geometry: open paper bands, cartographic rules, and square image frames. Avoid container-within-container card stacks and rounded card grids.
- Icons: thin custom SVG line icons, 1.5 px stroke; arrows are part of the navigation system, not plain-text glyphs.
- Motion: `transform`/`opacity` on scroll; a slow, CSS/SVG nucleus-to-synapse path in the hero; no auto-rotating slides. Every motion effect must obey `prefers-reduced-motion`.

## Proposed asset roles and evidence boundary

| Asset | Intended role | Source status | Release gate |
| --- | --- | --- | --- |
| `images/RBM3.png` | RNA Regulation chapter and selected publication visual | Existing repository asset; appears to be a paper mechanism figure | Confirm article/figure credit and reuse permission before release |
| `images/Axon_Local_Translation.jpg` | Local Translation chapter | Existing repository asset; appears to be a paper diagram | Confirm article/figure credit and reuse permission before release |
| `images/Chiasm.jpeg` / `Growth_Cone*.jpeg` | Neuronal-science atmospheric imagery | Already public on the current site; existing page credits Dr William A. Harris | Retain an explicit credit near any reuse; verify current intended credit wording |
| `images/Weixin*.png` | Candidate fluorescence hero/research imagery | Existing repository assets; provenance is not encoded in filenames | Identify experiment/paper/source and obtain desired credit wording before release |
| `images/EMBO_Paper.jpg` | Selected-paper thumbnail | Existing repository asset | Confirm that it is the intended EMBO paper visual and retain citation link |
| `images/iPSC-neuronal-differentiation.png` | Decorative visual rail on Research | User-supplied from `homepage_figure.zip`; not content evidence | User determines release authorization; retain empty alt text and no scientific caption |
| `images/illustrations/rna-field-notes-hero.webp` | Home/Research decorative illustration | Generated original field-note art, WebP derivative | Decorative only; empty alt; no scientific, personnel, or event claim |
| `images/illustrations/rna-field-notes-nocturne.webp` | Home/Publications decorative dark band | Generated original field-note art, WebP derivative | Decorative only; empty alt; no scientific, personnel, or event claim |
| `images/illustrations/rna-field-notes-research.webp` | Research/People/Profile decorative illustration | Generated original field-note art, WebP derivative | Decorative only; empty alt; no scientific, personnel, or event claim |
| `images/web/research-ann-culture.webp` | Home/Research real-image evidence stage | User-supplied from `Ann--胶质瘤.zip`; WebP derivative of one original TIFF | Caption only credits Ann Cloos; no scientific interpretation until metadata is confirmed |
| `images/web/julie-profile.webp` | PI profile portrait | WebP derivative of existing repository portrait | Use only for Julie’s profile; do not generate or substitute identity imagery |
| `images/web/paper-embj-2023-figure1.webp` | Publications selected-paper evidence | Complete Figure 1 rendered from the CC BY 4.0 EMBO Journal 2023 PDF, DOI `10.15252/embj.2022113168` | All panels retained; linked figure credit; no interpretation added |
| `images/web/paper-cell-2019-graphical-abstract.webp` | Publications archive evidence | Complete CC BY 4.0 graphical abstract from the 2019 Cell article, DOI `10.1016/j.cell.2018.11.030` | Natural square ratio retained; linked figure credit; no interpretation added |
| `images/web/growth-cone-harris.webp` | Research introductory scientific image | WebP derivative of existing `Growth_Cone_2.jpeg` repository asset | Original in-image credit to Dr William A. Harris retained; no claim that it is Lin Lab data |
| `images/web/ipsc-differentiation-rail.webp` | Research decorative process rail | WebP derivative of user-supplied `homepage_figure.zip` material | Empty alt and no added caption or scientific claim |
| `images/web/chiasm-harris.webp` | Reserve scientific image | WebP derivative of existing `Chiasm.jpeg` repository asset | Existing source record credits Dr William A. Harris; not active on Home |
| `images/web/lab-archive-cut.webp` | Home hero research image | 1600px WebP derivative of `homepage_figure.zip` `cut.jpg` | Small Lin Lab image archive credit; no scientific interpretation added |
| `images/web/lab-archive-spheroid.webp` | Research technique chapter image | WebP derivative of user-authorized `homepage_figure.zip` archive material | Small Lin Lab image archive credit; whole source geometry; no scientific interpretation added |
| `images/web/lab-archive-magenta.webp` | Research regulation chapter image | WebP derivative of user-authorized `homepage_figure.zip` archive material | Small Lin Lab image archive credit; source colour stays inside image; no scientific interpretation added |
| `images/web/lab-archive-dual-channel.webp` | Research health chapter image | WebP derivative of user-authorized `homepage_figure.zip` archive material | Small Lin Lab image archive credit; whole source geometry; no scientific interpretation added |
| `images/web/lab-archive-neuron-mono.webp` | People introduction inset | WebP derivative of user-authorized `homepage_figure.zip` archive material | Small Lin Lab image archive credit; atmosphere only, no personnel or scientific claim |
| `images/web/lab-archive-neuron-light.webp` | Join Us contact inset | WebP derivative of user-authorized `homepage_figure.zip` archive material | Small Lin Lab image archive credit; atmosphere only, no recruitment or scientific claim |

Existing repository presence establishes that an asset was previously deployed, not that every derivative or new use is legally cleared. The first implementation may use low-risk layout placeholders or already-published assets while the release ledger remains explicit.

## Build sequence

1. Replace the legacy Colorlib shell with a lightweight shared semantic layout, responsive top navigation, and a reusable token stylesheet.
2. Build the complete Home surface against the accepted concept; use source-derived lab copy and only verified assets.
3. Build Research, Publications, People, News, and Join Us using page-specific rhythms, retaining the complete canonical source content.
4. Add page metadata and remove unused legacy libraries and the failing global Google Maps script.
5. Verify desktop and mobile views visually, test all internal links, and check reduced-motion behavior before release.

## Explicit non-goals

- No fabricated research figures, results, member profiles, publication metadata, or claims.
- No direct scraping/republication of journal assets without an identified source and credit/permission decision.
- No marketing-style fake metrics, automatic hero carousel, overly generic AI imagery, or “futuristic” effects unrelated to RNA/neuroscience.
