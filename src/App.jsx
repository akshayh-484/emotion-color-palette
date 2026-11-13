import { useState, useEffect, useCallback, useRef } from 'react';
import EmotionSelector from './EmotionSelector';
import ColorDisplay from './ColorDisplay';
import Background from './Background';

// All emotion details are stored here in one place.
// accent = the representative colour used for the dot indicator and ring.
// g1-g4 = the four gradient stops for the main card (also the CSS fallback).
const EMOTIONS = [
  {
    id: 'calm',
    name: 'Calm',
    tagline: 'Like still waters beneath an open sky, these gentle blues bring a sense of peace, balance and tranquillity.',
    g1: '#93C5FD', g2: '#22D3EE', g3: '#0EA5E9', g4: '#0369A1',
    accent: '#38BDF8',   // sky blue — consistent with g2/g3
    text: '#fff',
  },
  {
    id: 'joy',
    name: 'Joy',
    tagline: "Inspired by golden sunlight, these warm colours capture the feeling of happiness, optimism and life's little celebrations.",
    g1: '#FEF08A', g2: '#FCD34D', g3: '#F59E0B', g4: '#B45309',
    accent: '#FBBF24',   // amber — consistent with g2/g3
    text: '#431407',     // dark text — readable on yellow
  },
  {
    id: 'energy',
    name: 'Energy',
    tagline: 'Bold like a glowing flame, these vibrant colours express passion, movement and the excitement of new possibilities.',
    g1: '#FCA5A5', g2: '#F97316', g3: '#EF4444', g4: '#991B1B',
    accent: '#F97316',   // orange — matches g2 exactly
    text: '#fff',
  },
  {
    id: 'focus',
    name: 'Focus',
    tagline: 'Like the quiet depth of twilight, these rich tones encourage clarity, concentration and a thoughtful state of mind.',
    g1: '#C4B5FD', g2: '#818CF8', g3: '#7C3AED', g4: '#3B0764',
    accent: '#A78BFA',   // soft violet — consistent with g1/g2
    text: '#fff',
  },
  {
    id: 'melancholy',
    name: 'Melancholy',
    tagline: 'Like a cloudy sky on a quiet afternoon, these muted shades capture reflection, nostalgia and the beauty of stillness.',
    g1: '#94A3B8', g2: '#64748B', g3: '#475569', g4: '#1E293B',
    accent: '#B0BCCC',   // lighter slate — clearly visible on dark backgrounds
    text: '#fff',
  },
];

// Each emotion stays on the screen for 4 seconds.
const DISPLAY_DURATION = 4000;

export default function App() {
  // Keeps track of which emotion is currently selected.
  const [activeIndex, setActiveIndex] = useState(0);

  // Controls whether the automatic colour animation is running.
  const [isAnimating, setIsAnimating] = useState(false);

  // Ref for the Start/Pause button — used for keyboard navigation
  const toggleBtnRef = useRef(null);

  // Updates the page colours whenever the selected emotion changes.
  useEffect(() => {
    const e = EMOTIONS[activeIndex];
    const root = document.documentElement;
    root.style.setProperty('--g1', e.g1);
    root.style.setProperty('--g2', e.g2);
    root.style.setProperty('--g3', e.g3);
    root.style.setProperty('--g4', e.g4);
    root.style.setProperty('--emotion-text', e.text);
    // Set data attribute for browsers that don't support @property transitions
    root.setAttribute('data-emotion', e.id);
  }, [activeIndex]);

  // Automatically moves to the next emotion every 4 seconds.
  useEffect(() => {
    if (!isAnimating) return;
    const timerId = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % EMOTIONS.length);
    }, DISPLAY_DURATION);
    // Clears the old timer before starting a new one.
    return () => clearTimeout(timerId);
  }, [isAnimating, activeIndex]);

  // Starts or pauses the animation when the button is clicked.
  const handleToggle = useCallback(() => {
    setIsAnimating((prev) => !prev);
  }, []);

  // Changes the selected emotion when a user clicks an option.
  const handleSelect = useCallback((index) => {
    setActiveIndex(index);
  }, []);

  // Global keyboard shortcuts — work immediately on page load, no click needed.
  // Up/Down arrows navigate emotions, Enter selects, Space toggles Start/Pause.
  useEffect(() => {
    const onKeyDown = (e) => {
      // Never intercept when typing in a form field or inside a popup
      const tag  = document.activeElement?.tagName?.toLowerCase();
      const role = document.activeElement?.closest('[role="dialog"]');
      if (tag === 'input' || tag === 'textarea' || role) return;

      switch (e.code) {
        case 'ArrowDown':
        case 'ArrowRight':
          // Only intercept ArrowDown globally when NO pill is focused
          // (pill's own onKeyDown handles it when a pill has focus)
          if (tag === 'button') return;
          e.preventDefault();
          setActiveIndex((prev) => (prev + 1) % EMOTIONS.length);
          break;

        case 'ArrowUp':
        case 'ArrowLeft':
          if (tag === 'button') return;
          e.preventDefault();
          setActiveIndex((prev) => (prev - 1 + EMOTIONS.length) % EMOTIONS.length);
          break;

        case 'Enter':
          // Enter globally selects current highlighted emotion only when
          // no specific button is focused (avoid double-firing)
          if (tag === 'button' || tag === 'a') return;
          e.preventDefault();
          // activeIndex is already set — just trigger the colour update
          // by forcing a re-render (no-op setActiveIndex with same value triggers effects)
          setActiveIndex((prev) => prev);
          break;

        case 'Space':
          // Space always toggles Start/Pause — prevent page scroll
          e.preventDefault();
          setIsAnimating((prev) => !prev);
          break;

        default:
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []); // runs once on mount — uses functional state updates so no stale closures

  const emotion = EMOTIONS[activeIndex];

  return (
    <div className="app">
      <Background emotionId={emotion.id} isAnimating={isAnimating} />

      <header className="header">
        <h1 className="header__title">Emotion Color Palette</h1>
        <p className="header__sub">Explore the colours behind your emotions.</p>
      </header>

      <main className="main" id="main-content" aria-label="Emotion selector and controls">
        <EmotionSelector
          emotions={EMOTIONS}
          activeIndex={activeIndex}
          onSelect={handleSelect}
          isAnimating={isAnimating}
          toggleBtnRef={toggleBtnRef}
        />

        <ColorDisplay emotion={emotion} />

        {/* Button to start or pause the animation. */}
        <div className="controls" role="group" aria-label="Animation controls">
          <button
            ref={toggleBtnRef}
            className={`controls__btn${isAnimating ? ' controls__btn--pause' : ''}`}
            onClick={handleToggle}
            aria-label={isAnimating ? 'Pause animation' : 'Start animation'}
            onKeyDown={(e) => {
              // ↑ from Start/Pause goes back up to the active emotion button
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                document.querySelector('.pill-wrap--active .selector__pill')?.focus();
              }
            }}
          >
            <span className="controls__icon" aria-hidden="true">
              {isAnimating ? (
                <span className="controls__icon-pause">
                  <span className="controls__icon-pause-bar" />
                  <span className="controls__icon-pause-bar" />
                </span>
              ) : '▶'}
            </span>
            {isAnimating ? 'Pause' : 'Start'}
          </button>
          <span
            className={`controls__status${isAnimating ? ' controls__status--live' : ''}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {isAnimating ? '● Animating' : '○ Paused'}
          </span>
        </div>
      </main>
    </div>
  );
}
