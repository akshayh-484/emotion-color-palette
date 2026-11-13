# Emotion Color Palette

🌐 **Live Demo:** [https://akshayh-484.github.io/emotion-color-palette/](https://akshayh-484.github.io/emotion-color-palette/)

---

Emotion Color Palette is a small interactive frontend project that explores five emotions through colour. Each emotion has its own gradient and a short description explaining the colour choices behind it.

You can select an emotion manually, or press Start to let the app cycle through all five automatically. When the animation is running, gold particles and fireworks appear in the background. Pressing Pause stops everything and keeps the current emotion on screen.

---

## How to Run

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the URL shown in the terminal, usually `http://localhost:5173`.

To build for production:

```bash
npm run build
```

---

## Features

- Five emotions: Calm, Joy, Energy, Focus and Melancholy
- Each emotion has a colour gradient and a short description
- Click an emotion to update the main display card
- Press the eye icon on any button to read about the colour choices
- Start button cycles through all five emotions every four seconds
- Pause button stops the cycling and all background animations
- Background gold particles and fireworks play during automatic cycling
- Works on mobile and desktop
- Keyboard accessible with visible focus indicators

---

## Project Structure

```
src/
  App.jsx              — Application state, emotion data, Start/Pause logic
  EmotionSelector.jsx  — Five emotion buttons and information popups
  ColorDisplay.jsx     — Main gradient display card
  Background.jsx       — Canvas particles and fireworks
  style.css            — All styles and responsive layout

index.html             — Entry point with fonts and skip-to-content link
vite.config.js         — Vite configuration
package.json           — Dependencies and scripts
```

---

## How the Colour Transitions Work

Each emotion has four gradient colour values. When an emotion is selected, the app updates four CSS custom properties on the page:

```js
root.style.setProperty('--g1', e.g1);
root.style.setProperty('--g2', e.g2);
root.style.setProperty('--g3', e.g3);
root.style.setProperty('--g4', e.g4);
```

These properties are registered using `@property` with the type set to `<color>`. This tells the browser they are colours and allows them to transition smoothly. The gradient on the display card fades from one palette to the next automatically.

On mobile browsers that do not support `@property`, a separate fallback rule applies the correct gradient directly based on a data attribute.

---

## How Start and Pause Work

The app uses two state values: `activeIndex` (the current emotion) and `isAnimating` (whether the cycle is running).

```js
useEffect(() => {
  if (!isAnimating) return;
  const timerId = setTimeout(() => {
    setActiveIndex((prev) => (prev + 1) % EMOTIONS.length);
  }, 4000);
  return () => clearTimeout(timerId);
}, [isAnimating, activeIndex]);
```

A `setTimeout` moves to the next emotion after four seconds. The cleanup function cancels it whenever the state changes, so only one timer runs at a time. When Pause is clicked, `isAnimating` becomes false and both the timer and canvas animations stop.

---

## Accessibility

- All emotion buttons are reachable by keyboard and have descriptive labels
- The eye icon beside each button supports keyboard activation and has ARIA attributes
- Popups use `role="dialog"` with focus management and Escape key support
- The Start/Pause button label updates dynamically to match its current state
- An `aria-live` region announces changes to screen readers
- A skip-to-content link is present for keyboard users
- Keyboard focus indicators are visible on all interactive elements
- CSS animations are disabled automatically for users who prefer reduced motion

**Keyboard shortcuts:**

| Key | Action |
|---|---|
| Tab | Move between buttons |
| Right Arrow / Down Arrow | Next emotion |
| Left Arrow / Up Arrow | Previous emotion |
| Enter / Space | Select emotion or activate button |
| Spacebar (anywhere) | Toggle Start/Pause |
| Escape | Close information popup |

---

## Technologies Used

- React 18
- Vite 5
- HTML5 Canvas
- CSS3 with `@property` for colour transitions
- Google Fonts — Playfair Display and Inter
