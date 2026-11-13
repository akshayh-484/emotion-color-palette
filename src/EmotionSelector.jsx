import { useState, useEffect, useLayoutEffect, useRef } from 'react';

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
  // popupStyle is computed synchronously before render so there's no position flash
  const [popupStyle, setPopupStyle] = useState(null);

  const eyeRefs  = useRef({});
  const wrapRefs = useRef({});
  const pillRefs = useRef({});

  // Initialise eyeRefs entries for each emotion
  for (let i = 0; i < emotions.length; i++) {
    const id = emotions[i].id;
    if (!eyeRefs.current[id]) eyeRefs.current[id] = { current: null };
  }

  // Compute popup position synchronously before browser paints.
  // Runs whenever openId changes — position is ready before EmotionPopup mounts.
  useLayoutEffect(() => {
    if (!openId) { setPopupStyle(null); return; }

    const wrapEl = wrapRefs.current[openId];
    if (!wrapEl) { setPopupStyle(null); return; }

    const isMob = window.innerWidth <= 768;

    if (isMob) {
      // Fixed positioning on mobile — popup floats over the whole page
      const rect   = wrapEl.getBoundingClientRect();
      const vw     = window.innerWidth;
      const popupW = Math.min(POPUP_W, vw - POPUP_MARGIN * 2);
      const idealLeft = rect.left + rect.width / 2 - popupW / 2;
      const left   = Math.max(POPUP_MARGIN, Math.min(idealLeft, vw - popupW - POPUP_MARGIN));
      const idealTop  = rect.bottom + 8;
      const maxTop    = window.innerHeight - 220 - POPUP_MARGIN;
      const top    = Math.max(POPUP_MARGIN, Math.min(idealTop, maxTop));
      setPopupStyle({
        position: 'fixed',
        top:  `${top}px`,
        left: `${left}px`,
        width: `${popupW}px`,
      });
    } else {
      // Desktop: absolute positioning relative to pill-wrap
      // Clamp left so popup never overflows the right viewport edge
      const rect  = wrapEl.getBoundingClientRect();
      const vw    = window.innerWidth;
      // Ideal: align left edge of popup with left edge of pill-wrap
      let left = 0;
      // If popup would overflow right viewport edge, shift it left
      const overflowRight = rect.left + POPUP_W - vw + POPUP_MARGIN;
      if (overflowRight > 0) {
        left = -overflowRight;
      }
      setPopupStyle({
        position: 'absolute',
        top:  'calc(100% + 8px)',
        left: `${left}px`,
        width: `${POPUP_W}px`,
      });
    }
  }, [openId]);

  const handleEyeClick = (e, emotionId) => {
    e.stopPropagation();
    setOpenId((prev) => (prev === emotionId ? null : emotionId));
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
