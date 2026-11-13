import { useState, useEffect, useRef } from 'react';

const NOTES = {
  calm: {
    meaning: 'Peace and Balance.',
    reason: 'Soft blue and aqua are inspired by still water and open skies. Blue represents stability and tranquillity, while aqua adds a refreshing and peaceful feeling.',
  },
  joy: {
    meaning: 'Happiness and Warmth.',
    reason: 'Warm yellow and soft peach reflect sunshine and happiness. Yellow represents optimism and positivity, while peach adds warmth and a cheerful feeling.',
  },
  energy: {
    meaning: 'Movement and Vitality.',
    reason: 'Vibrant orange and red are inspired by fire and movement. Orange represents enthusiasm and excitement, while red adds intensity and a sense of power.',
  },
  focus: {
    meaning: 'Clarity and Concentration.',
    reason: 'Deep blue and violet create a sense of clarity and concentration. Blue represents trust and stability, while violet adds depth and encourages thoughtful attention.',
  },
  melancholy: {
    meaning: 'Reflection and Nostalgia.',
    reason: 'Muted blue and grey reflect rainy skies and quiet moments. Blue represents reflection and sadness, while grey adds a sense of stillness and introspection.',
  },
};

const POPUP_W      = 268;  // matches CSS .emotion-popup width
const POPUP_MARGIN = 10;

function EyeIcon() {
  return (
    <svg
      className="pill__eye-icon"
      viewBox="0 0 20 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M1 7C1 7 4 1 10 1s9 6 9 6-3 6-9 6S1 7 1 7Z" />
      <circle cx="10" cy="7" r="2.5" />
    </svg>
  );
}

function EmotionPopup({ emotion, onClose, triggerRef, popupStyle }) {
  const popupRef = useRef(null);
  const closeRef = useRef(null);
  const note     = NOTES[emotion.id];

  // Move focus to close button when popup opens
  useEffect(() => { closeRef.current?.focus(); }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); triggerRef.current?.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, triggerRef]);

  // Close when clicking outside
  useEffect(() => {
    const onOutside = (e) => {
      if (
        popupRef.current   && !popupRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) onClose();
    };
    // small delay so the click that opened it doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', onOutside), 10);
    return () => { clearTimeout(id); document.removeEventListener('mousedown', onOutside); };
  }, [onClose, triggerRef]);

  return (
    <div
      className="emotion-popup"
      style={popupStyle}
      ref={popupRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${emotion.name} colour notes`}
    >
      <button
        ref={closeRef}
        className="emotion-popup__close"
        onClick={onClose}
        aria-label="Close colour notes"
      >✕</button>

      <p className="emotion-popup__emotion">{emotion.name}</p>

      <div className="emotion-popup__row">
        <span className="emotion-popup__label">Meaning</span>
        <span className="emotion-popup__value">{note.meaning}</span>
      </div>

      <div className="emotion-popup__row">
        <span className="emotion-popup__label">Why these colours</span>
        <span className="emotion-popup__value">{note.reason}</span>
      </div>
    </div>
  );
}

export default function EmotionSelector({ emotions, activeIndex, onSelect, isAnimating, toggleBtnRef }) {
  const [openId,     setOpenId]     = useState(null);
  // popupStyle is computed synchronously in the click handler before any render
  const [popupStyle, setPopupStyle] = useState(null);

  const eyeRefs  = useRef({});
  const wrapRefs = useRef({});
  const pillRefs = useRef({});
  const navRef   = useRef(null);   // reference to the <nav> — never transformed

  // Initialise eyeRefs entries for each emotion
  for (let i = 0; i < emotions.length; i++) {
    const id = emotions[i].id;
    if (!eyeRefs.current[id]) eyeRefs.current[id] = { current: null };
  }

  // Compute popup position from the pill-wrap element synchronously.
  // Always uses position:fixed so the popup is above every stacking context.
  // Top anchor uses the NAV bottom (never transformed) so the active-pill lift
  // animation (translateY -3px) doesn't cause the popup to jump.
  function calcStyle(emotionId) {
    const wrapEl = wrapRefs.current[emotionId];
    if (!wrapEl) return null;
    const wrapRect = wrapEl.getBoundingClientRect();
    const vw       = window.innerWidth;
    const isMob    = vw <= 768;
    const popupW   = isMob ? Math.min(POPUP_W, vw - POPUP_MARGIN * 2) : POPUP_W;

    // Horizontal: centre over the pill-wrap (its left/width are unaffected by translateY)
    const idealLeft = wrapRect.left + wrapRect.width / 2 - popupW / 2;
    const left      = Math.max(POPUP_MARGIN, Math.min(idealLeft, vw - popupW - POPUP_MARGIN));

    // Vertical: use the nav bottom as anchor so the pill-lift transform doesn't cause a jump
    const navBottom = navRef.current
      ? navRef.current.getBoundingClientRect().bottom
      : wrapRect.bottom;
    const idealTop = navBottom + 8;
    const minSpace = isMob ? 220 : 260;
    const maxTop   = window.innerHeight - minSpace - POPUP_MARGIN;
    const top      = Math.max(POPUP_MARGIN, Math.min(idealTop, maxTop));

    return { position: 'fixed', top: `${top}px`, left: `${left}px`, width: `${popupW}px` };
  }

  // When animation is running, activeIndex changes every 4s.
  // The active pill's lift transform (translateY -3px) moves between pills on each change.
  // Recalculate popup position after the DOM settles (via requestAnimationFrame)
  // so the popup stays locked to the correct pill-wrap position.
  useEffect(() => {
    if (!openId) return;
    // rAF waits for the browser to apply the new transform before measuring
    const raf = requestAnimationFrame(() => {
      const style = calcStyle(openId);
      if (style) setPopupStyle(style);
    });
    return () => cancelAnimationFrame(raf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, openId]);

  const handleEyeClick = (e, emotionId) => {
    e.stopPropagation();
    // Compute position right here — synchronously, before setState —
    // so both openId and popupStyle land in the same React batch → one render → no flash
    if (openId === emotionId) {
      setOpenId(null);
      setPopupStyle(null);
    } else {
      const style = calcStyle(emotionId);
      setPopupStyle(style);
      setOpenId(emotionId);
    }
  };

  // Arrow key navigation between emotion buttons
  const handlePillKeyDown = (e, index) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (index + 1) % emotions.length;
      onSelect(next);
      pillRefs.current[emotions[next].id]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (index - 1 + emotions.length) % emotions.length;
      onSelect(prev);
      pillRefs.current[emotions[prev].id]?.focus();
    }
  };

  return (
    <nav
      ref={navRef}
      className={`selector${isAnimating ? ' selector--animating' : ''}`}
      aria-label="Choose an emotion"
    >
      {emotions.map((emotion, index) => {
        const isActive = index === activeIndex;
        const isOpen   = openId === emotion.id;

        return (
          <div
            key={emotion.id}
            ref={(el) => { wrapRefs.current[emotion.id] = el; }}
            className={`pill-wrap${isActive ? ' pill-wrap--active' : ''}`}
            data-emotion-id={emotion.id}
            style={{ '--pill-accent': emotion.accent }}
          >
            <button
              ref={(el) => { pillRefs.current[emotion.id] = el; }}
              className={`selector__pill${isActive ? ' selector__pill--active' : ''}`}
              onClick={() => onSelect(index)}
              onKeyDown={(e) => handlePillKeyDown(e, index)}
              aria-pressed={isActive}
              aria-label={`Select ${emotion.name} emotion`}
            >
              <span
                className="selector__dot"
                style={{ background: emotion.accent }}
                aria-hidden="true"
              />
              <span className="selector__pill-name">{emotion.name}</span>
              <span
                ref={(el) => { eyeRefs.current[emotion.id].current = el; }}
                className={`pill__eye${isOpen ? ' pill__eye--open' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Show colour notes for ${emotion.name}`}
                aria-expanded={isOpen}
                aria-haspopup="dialog"
                onClick={(e) => handleEyeClick(e, emotion.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleEyeClick(e, emotion.id);
                  }
                }}
              >
                <EyeIcon />
              </span>
            </button>

            {/* Only render popup when popupStyle is ready — eliminates position flash */}
            {isOpen && popupStyle && (
              <EmotionPopup
                emotion={emotion}
                onClose={() => setOpenId(null)}
                triggerRef={eyeRefs.current[emotion.id]}
                popupStyle={popupStyle}
              />
            )}
          </div>
        );
      })}
    </nav>
  );
}
