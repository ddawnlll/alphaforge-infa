# DesignForge — Design Intelligence Engine Derin Araştırması

*Tarih: 7 Temmuz 2026 — Güncellenmiş Sürüm*

---

## TL;DR

DesignForge = **Website audit → design retrieval → blueprint generator → component/animation assembly**. Açık kaynak olarak uçtan uca böyle bir sistem **yok**. Ama her katmanın parçaları hazır:

| Katman | Durum | En iyi araçlar |
|---|---|---|
| Veri toplama | Çözülmüş | Playwright, Firecrawl |
| Otomatik audit | Bilimsel olarak doğrulanmış | Lighthouse + VLM-as-Judge (%79 insan uyumu, UICrit) |
| Visual retrieval | Çözülmüş, ürünleşmemiş | UIClip (MRR 0.385), SigLIP + Qdrant/pgvector |
| Blueprint/skeleton | Relume tek ciddi rakip | — |
| Component/animation assembly | Ekosistem çok güçlü | shadcn registry, Magic UI (MIT, 21K stars), Aceternity, GSAP |
| Design token extraction | Yeni GitHub araçları var | design-extract (MIT, 2026) — DTCG tokens → Tailwind v4 code |
| Design clone | 2026'da patlama yaptı | design-clone (MIT), ai-design-reference-library (~$0.10/site) |

---

## Yeni Bulgular (Bu Araştırmada Keşfedilen)

### 1. `ai-design-reference-library` (OlisaUmenyiora, 2026)
**En yakın şey.** Playwright + Claude AI ile:
- Multi-viewport screenshot (desktop/tablet/mobile)
- Scroll animation frames (25 kare, parallax yakalıyor)
- Interactive state capture (hover, focus)
- Dark mode detection
- GSAP recreation code generation (~$0.10/site)
- **MCP Server** — Claude CLI'ye design library expose ediyor

**Eksikleri:** Sadece capture + GSAP code generation. Audit, retrieval, blueprint, component registry yok. Tek yönlü (toplama → kod, döngü yok).

**Integration fırsatı:** Bunu DesignForge'un ingest katmanı olarak kullan. $0.10/site → 1000 site = $100. Çok ucuz.

### 2. `design-clone` (bienhoang, 2026, MIT)
Claude Code skill olarak çalışıyor:
- Multi-viewport screenshots (1920/768/375)
- HTML/CSS extraction with unused CSS removal
- Hover state capture
- AI structure analysis (built-in, no API key)
- Asset extraction
- Design token extraction

**Eksikleri:** Sadece clone, audit/retrieval/blueprint yok. Bir siteyi kopyalamak için, orijinal üretmek için değil.

### 3. `design-extract` (Shantimdx, 2026, MIT)
Tersine mühendislik aracı:
- DTCG-standard design token extraction
- Code emitters: SwiftUI, Compose, Flutter, WordPress, **Tailwind v4**
- Component → shadcn/ui mapping
- WCAG accessibility checks
- CSS health audit
- MCP server + Chrome extension

**Eksikleri:** Sadece extraction. Tasarım üretmiyor, sadece mevcudu analiz ediyor.

### 4. Relume MCP (Temmuz 2026 — bu ay çıktı!)
Relume 1000+ component library'sini Cursor/Claude/Windsurf/VS Code'a MCP üzerinden açtı. AI assistant "hero section with testimonial marquee" dediğinde Relume'dan real component çekiyor.

**Wireframing 2.0** ile:
- Brand style fit: "off-grid/overlapping for agencies, card layouts for SaaS"
- Section content match: "2 pricing plans → 2-plan layout"
- Page flow awareness
- Site-wide consistency

**Tehdit:** Relume MCP, bizim yapmak istediğimiz "component registry + AI selection" kısmını şimdiden yapıyor. Ama **retrieval + audit + uniqueness engine** hala boşluk.

### 5. UIClip (UIST'24, CMU) — Detaylı İnceleme
- CLIP B/32'yi 4 aşamada fine-tune etmiş
- **JitterWeb dataset:** 2.3M UI pair (original + jittered = design defects)
- **BetterApp dataset:** 1.2K professional designer ratings
- MRR (retrieval): 0.3851 (BetterApp), 0.4085 (JitterWeb)
- Çıplak CLIP'ten daha iyi, pairwise loss'tan daha kötü (çünkü pairwise loss ranking için değil)
- HuggingFace'de model var: `biglab/uiclip_jitteredwebsites-2-224-paraphrased`
- **Kullanım:** screenshot + caption → score. "ui screenshot. well-designed {caption}" prefix'i ile score hesaplıyor.

**Integration:** Fine-tune edilmiş model hazır. HuggingFace'den çek + ONNX'e çevir + edge'de çalıştır. MVP'de direkt API çağrısı, v1'de ONNX runtime.

### 6. AesEval-Bench (2025)
VLM'lerin grafik tasarım estetiğini değerlendirme benchmark'ı:
- 4 dimension, 12 indicator, 3 task (judgment/region/localization)
- GPT-4o > open-source > reasoning models (sürpriz: reasoning avantaj sağlamıyor)
- Human-guided VLM labeling + indicator-grounded reasoning ile fine-tune
- **Kod ve dataset:** https://github.com/arctanxarc/AesEval-Bench

---

## Mimari Kararları (Güncellenmiş)

### Agent-native (sabit pipeline değil)
DesignForge bir DAG değil — Hermes agent'ın içinde yaşayan tool set'i. Skill'ler "aşama" değil "tool"dur. Sırasına agent karar verir. Sadece 3 hard gate:
1. Build/render geçiyor mu
2. Outbound email insan onaylı
3. Vector index önceden hazır (maliyet kontrolü)

### Section-level indexing
Site-level değil, section-level retrieval. Vision2UI/DCGen literatürü segment bazlı yaklaşımın daha iyi olduğunu gösteriyor. Her section: component type + layout fingerprint + industry tag + conversion score.

### Component registry taxonomy
Her component'e:
- `best_for: [industries]`
- `avoid_for: [industries]`
- `intended_animation: string`
- `conversion_strength: low|medium|high`
- `trust_signals: boolean`

Bu sayede AI "güzel ama müşteriye uymayan" component seçemez.

### VLM audit — few-shot golden set
UICrit bulgusu: çıplak prompt zayıf, örnekli prompt güçlü (%55 improvement). 20-30 elle yazılmış kaliteli critique bizim golden set'imiz olmalı. `config/audit-rubric.yaml`'de başlangıç seti var (giydiriyo + pnwx örnekleri).

### Rubric-based scoring (formula değil)
Sabit ağırlık formülü yok. Agent'a rubric ver, bağlama göre karar versin. Tek sabit kural: **commercial_fit veto hakkı** — < 5 ise otomatik red.

---

## Güncellenmiş MVP Yol Haritası

### v0 (1-2 hafta) — TAMAMLANDI (kod seviyesinde)
✅ `forge.js` entry point — "URL ver → 10 saniyede redesign blueprint"
✅ Design retrieval engine (3-reference yaklaşımı)
✅ Blueprint generator (6 dosya: yaml, tokens, component plan, animation plan, copy outline, risks)
✅ shadcn-compatible registry (9 taxonomy-tagged component)
✅ Animation taxonomy (15 technique × 3 intensity levels)
✅ Playwright capture engine (screenshot + DOM + metadata)
✅ Awwwards scraper
✅ Lighthouse + VLM audit engine
✅ Design Index (vector embedding + layout fingerprint)
✅ Hermes profile config (`designforge`)
✅ 8 Hermes outreach skills

### v1 (1 ay)
- **Design Judge entegrasyonu:** UIClip modelini HuggingFace'den çek, ONNX'te çalıştır
- **Section-level indexing:** Magic UI'dan 150+ component'i section bazında indeksle
- **Relume MCP analizi:** Relume'un component seçim mantığını tersine mühendislikle çöz
- **Firecrawl entegrasyonu:** capture + markdown + screenshot tek API'da
- **100 site seed:** 10 sektör × 10 iyi site manuel topla, indeksle

### v2 (2-3 ay)
- **1000+ site index:** Awwwards + CSSDA + Godly + curated
- **Layout embedding:** UISearch graph-based yaklaşımı
- **Animation registry:** GSAP/Motion primitives → industry mapping
- **Tailwind v4 token pipeline:** DTCG tokens → Next.js çıktı
- **Quality gate:** Lighthouse + Design2Code metrikleri + VLM final critique
- **Outreach pipeline:** lead bul → audit → blueprint → draft → Discord report

---

## GitHub'da Bulunanlar (Karşılaştırma)

| Repo | Stars | Lisans | Ne Yapıyor | Eksik |
|---|---|---|---|---|
| **ai-design-reference-library** | ~50 | ? | Playwright + Claude ile site capture + GSAP code | Audit/retrieval/blueprint yok |
| **design-clone** | 4 | MIT | Multi-viewport clone + token extraction | Sadece clone, orijinal üretim yok |
| **design-extract** | 0 | MIT | Design token extraction → Tailwind v4 code | Sadece extraction |
| **awwwards-website-scraper** | 0 | ? | Awwwards metadata scraping | Zayıf, production-grade değil |
| **Magic UI** | 21,355 | **MIT** | 150+ animated component | Component library, bizim engine'miz değil |
| **Relume** | — | Proprietary | Sitemap → wireframe → component | Retrieval yok, jenerik kokuyor |
| **DesignForge** (biz) | — | Private | **Full pipeline: audit → retrieval → blueprint → assembly** | Daha MVP aşaması |

---

## Hukuki Durum (Güncellenmiş)

- **ai-design-reference-library** benzeri araçların varlığı, screenshot + metadata toplamanın yaygın kabul gördüğünü gösteriyor
- **design-extract** ve **design-clone** MIT lisanslı → ticari kullanım sorunsuz
- **Magic UI** (MIT) → registry'mize fork edip kullanabiliriz, client sitelerde kullanabiliriz, satabiliriz
- **Aceternity** → client sitelerde kullanabiliriz ama registry'mize kopyalayıp satamayız
- **Relume MCP** → sadece abonelikle, kendi registry'miz olmalı
- 3-reference blueprint (structure/mood/motion farklı sitelerden) türev-eser riskini pratikte öldürüyor
- Public sayfaları scrape: hiQ v. LinkedIn'de ToS ihlalinden kaybedildi, CFAA değil. Rate-limit + login'siz + analiz amaçlı toplamak düşük risk.

---

## Kaynaklar

**Yeni Keşfedilen GitHub:**
- [ai-design-reference-library](https://github.com/OlisaUmenyiora/ai-design-reference-library) — Playwright + Claude ile site capture + GSAP code
- [design-clone (MIT)](https://github.com/bienhoang/design-clone) — Claude Code skill for design capture
- [design-extract (MIT)](https://github.com/Shantimdx/design-extract) — DTCG token extraction → Tailwind v4
- [UIClip HuggingFace](https://huggingface.co/biglab/uiclip_jitteredwebsites-2-224-paraphrased)
- [AesEval-Bench](https://github.com/arctanxarc/AesEval-Bench) — VLM aesthetic evaluation benchmark

**Önceki Kaynaklar (Doğrulandı):**
- [UIClip paper (UIST'24)](https://arxiv.org/html/2404.12500v1)
- [UISearch (2025)](https://arxiv.org/html/2511.19380)
- [UICrit (UIST'24)](https://arxiv.org/html/2407.08850)
- [Design2Code (NAACL'25)](https://aclanthology.org/2025.naacl-long.199.pdf)
- [MLLM-as-a-Judge](https://mllm-judge.github.io/)
- [DesignPref (2025)](https://arxiv.org/pdf/2511.20513)
- [Relume MCP (Temmuz 2026)](https://www.relume.io/whats-new/july-2026-release)
- [Magic UI (MIT)](https://github.com/magicuidesign/magicui)
- [shadcn registry docs](https://ui.shadcn.com/docs/registry)
- [Tailwind v4 theme variables](https://tailwindcss.com/docs/theme)
- [Firecrawl docs](https://docs.firecrawl.dev/features/scrape)

---

## Nihai Verdict

1. **Bizden önce kimse yapmamış** — uçtan uca "audit → retrieval → blueprint → assembly" sistemini kuran yok. En yakın rakip Relume, ama onun da retrieval + uniqueness engine'i yok.

2. **Parçalar hazır** — UIClip (quality scoring), Magic UI (components, MIT, 21K stars), shadcn registry (distribution), Playwright (capture), Lighthouse (audit), VLM-as-Judge (critique). Hiçbir şeyi sıfırdan yazmıyoruz.

3. **Outreach entegrasyonu silah** — "URL ver → 10 saniyede redesign blueprint" outreach için manyak değerli. Pacific NW X-Ray'e "şu sorunlarınız var, işte önerilen section flow, işte renk paleti, işte referans siteler" dersen cevap oranın katlanır.

4. **Moat gerçek** — Retrieval + audit + component registry'yi tek pipeline'a bağlayan yok. Relume'un MCP'si tehdit ama onun da "sektöre özel retrieval"i yok.

5. **alphaforge-infa entegrasyonu doğru karar** — Judge sistemini design quality'a genişletmek, ayrı bir profile koymak, cron + skill altyapısını kullanmak. Tri-gate'te T3 Design Judge olarak VLM çalıştırmak akademik olarak savunulabilir (UICrit, MLLM-as-a-Judge).
