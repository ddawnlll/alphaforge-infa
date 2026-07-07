# DesignForge — Animation Taxonomy & Registry

## Animation Techniques

| Technique | Description | Best For | Avoid For | Performance Impact |
|---|---|---|---|---|
| `fade_up` | Element fades in while sliding up | Any content section | Hero titles | Very low |
| `stagger_fade_up` | Children fade up with delay | Feature grids, lists | Single elements | Low |
| `text_reveal` | Characters/words animate in | Headlines, hero text | Body text | Medium |
| `parallax` | Background moves slower than foreground | Hero images, full-bleed | Dense information | Low |
| `marquee_scroll` | Infinite horizontal scroll | Logos, testimonials | Navigation | Medium |
| `card_scale_in` | Cards scale up on scroll | Pricing, portfolio | Text content | Low |
| `slide_in` | Element slides from side | CTAs, side panels | Main content | Low |
| `hover_distortion` | Elements warp/move on hover | Gallery, interactive | Forms, text | Medium |
| `sticky_sections` | Sections stack as user scrolls | Storytelling, process | Standard pages | Medium |
| `WebGL` | 3D shader-based effects | Hero, backgrounds | Any content area | High |
| `cursor_trail` | Particle/glow follows cursor | Interactive heroes | Dense pages | Medium |
| `split_text` | Words/letters separate then join | Premium hero titles | Mobile-view text | Low |
| `scroll_progress` | Progress bar/indicator | Long-form, storytelling | Short pages | Very low |
| `morph` | SVG/shape morphing | Logos, icons | UI elements | Medium |
| `float` | Gentle floating animation | CTAs, badges | Body content | Very low |

## Animation Intensity Levels

### subtle
- Duration: 0.3s - 0.6s
- Easing: ease-out
- Techniques: fade_up, stagger_fade_up, float
- Best for: Medical, B2B, industrial, content-heavy
- reduced-motion: respect

### medium  
- Duration: 0.6s - 1.0s
- Easing: cubic-bezier(0.16, 1, 0.3, 1)
- Techniques: text_reveal, parallax, sticky_sections, marquee
- Best for: SaaS, agency, ecommerce, startups
- reduced-motion: respect

### heavy
- Duration: 0.8s - 1.5s
- Easing: cubic-bezier(0.34, 1.56, 0.64, 1)
- Techniques: WebGL, cursor_trail, morph, hover_distortion
- Best for: Agency showcase, gaming, luxury, entertainment
- reduced-motion: respect

## Motion Principles

1. **Purposeful** — Every animation must serve: guide attention, provide feedback, or enhance storytelling. No decoration.
2. **Performant** — Only animate `transform` and `opacity`. Use `will-change` sparingly. Target 60fps.
3. **Accessible** — Respect `prefers-reduced-motion`. Provide `data-no-animation` override.
4. **Consistent** — Same duration/easing for same type of animations. Use design tokens for motion.
5. **Staggered** — Children enter in sequence (0.05s - 0.1s delay). Never all at once.
6. **Scroll-triggered** — Use Intersection Observer. Animate once, don't repeat on re-scroll.

## Animation Implementation Plan

```typescript
// Motion token design system
const motion = {
  durations: {
    fast: '0.3s',
    medium: '0.6s', 
    slow: '1.0s'
  },
  easings: {
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    linear: 'linear'
  },
  variants: {
    fadeUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    },
    stagger: {
      animate: { transition: { staggerChildren: 0.1 } }
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
  }
};
```
