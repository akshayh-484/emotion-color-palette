# Emotion Color Palette
## Project Improvements Based on Feedback

After receiving feedback on my Emotion Color Palette project, I reviewed each suggestion and made improvements to address the issues. My main focus was improving mobile responsiveness, animation performance, keyboard accessibility, pause behaviour and code quality while maintaining the original design.

Below is a summary of the improvements made and the testing carried out.

---

## 1. Mobile Responsiveness

**Feedback:** Some information popups were not displaying correctly on smaller screens, and the Start/Pause button needed better alignment.

**Improvements made:**

- Adjusted the mobile layout to display the five emotion buttons in two rows, with three buttons in the first row and two in the second.
- Improved popup positioning using `getBoundingClientRect()` to keep popups within the visible screen area.
- Adjusted popup placement when there is limited space near the bottom of the screen.
- Centred the Start/Pause button and adjusted its width for better alignment on mobile devices.

**Testing:**

Checked the layout at different screen widths, including 360px, 390px and 412px. Also tested the application on a mobile phone to verify the layout, buttons and information popups.

---

## 2. Animation Performance

**Feedback:** The fireworks and background animations appeared to affect performance.

**Improvements made:**

Reviewed the animation logic in `Background.jsx` and made the following changes:

- Used a single `requestAnimationFrame` loop for background animations.
- Added frame rate control to maintain approximately 60 frames per second.
- Limited canvas resolution to a maximum device pixel ratio of 2.
- Reduced the number of dust particles and sparks on smaller screens.
- Reused existing particle objects to reduce unnecessary object creation.
- Cached the mobile screen check instead of recalculating it on every frame.
- Added canvas clipping so particles do not appear over the main colour card.
- Added cleanup for animation frames and resize event listeners.
- Supported the user's reduced-motion setting.

**Testing:**

Checked the background animations in the browser after the changes. Verified that the fireworks and particles displayed correctly and that the animation continued to work smoothly.

---

## 3. Accessibility and Keyboard Navigation

**Feedback:** Interactive elements needed better keyboard navigation and accessibility support.

**Improvements made:**

Improved the accessibility of the interactive elements so users can operate the application using a keyboard.

- Added accessible labels to the emotion buttons.
- Used `aria-pressed` to indicate the selected emotion.
- Added keyboard support for the information buttons using Enter and Space.
- Added appropriate accessibility attributes to the information popups.
- Moved keyboard focus to the popup's close button when it opens.
- Added Escape-key support to close popups and return focus to the button that opened them.
- Updated the Start/Pause button's accessible label according to its current state.
- Added live announcements for changes to the selected emotion and animation status.
- Added visible focus indicators for keyboard navigation.
- Included a skip-to-content link.
- Marked decorative background elements as hidden from assistive technologies.

**Keyboard controls:**

The application can also be operated without a mouse on desktop using these keyboard controls:

| Key | Function |
|---|---|
| Tab | Moves between interactive buttons |
| Right Arrow / Down Arrow | Moves to the next emotion |
| Left Arrow / Up Arrow | Moves to the previous emotion |
| Enter | Selects the focused emotion and updates the main colour display |
| Spacebar | Toggles Start/Pause from anywhere on the page |
| Escape | Closes an open information popup |

Arrow key navigation wraps around, so pressing Down Arrow on the last emotion returns to the first.

**Testing:**

Tested keyboard navigation directly in the browser without using a mouse. Checked movement between all five emotions, emotion selection using Enter, information popup controls, and starting and pausing the animation using the keyboard.

---

## 4. Pause Functionality

**Feedback:** Background animations were continuing after clicking Pause.

**Improvements made:**

Reviewed the Start/Pause functionality in `App.jsx` and `Background.jsx` to improve how the emotion transitions and background effects are controlled.

When Pause is activated:

- The automatic emotion-changing timer is cleared.
- Fireworks, sparks and golden particles disappear from the canvas.
- No new canvas effects are drawn while paused.

When Start is activated:

- The background particle and fireworks effects appear again.
- Automatic emotion transitions resume.
- The animation continues from the current emotion.

I also checked that repeatedly switching between Start and Pause does not create duplicate timers or animation effects.

The canvas loop exits early without drawing while paused. The subtle decorative background blobs continue their CSS animations.

**Testing:**

Activated Pause and checked that the fireworks and golden particles disappeared. Activated Start again and confirmed that the effects returned and automatic emotion transitions resumed. Repeated the process several times.

---

## 5. Code Optimisation

**Feedback:** The implementation should remain simple, with priority given to the main requirements.

**Improvements made:**

Reviewed the project files and removed unnecessary code and properties.

- Removed unused `borderColor` and `spinColor` properties from the emotion data.
- Simplified the eye icon reference initialisation in `EmotionSelector.jsx`.
- Removed an outdated CSS comment.
- Simplified an unnecessary CSS keyframe definition.

No external animation or UI libraries were added. The project continues to use React, React DOM, Vite, CSS animations and the browser's built-in Canvas API.

**Testing:**

Ran `npm run build` after making the changes. The production build completed successfully without errors. Also checked the main features, including emotion selection, information popups, keyboard navigation and Start/Pause functionality.

---

## Testing Summary

| Test | Result |
|---|---|
| Production build (`npm run build`) | Passed |
| All five emotion buttons | Working |
| Information popups | Working |
| Automatic emotion transitions | Working |
| Pause and resume | Working |
| Tab navigation | Tested |
| Arrow-key navigation between emotions | Tested |
| Enter to select an emotion | Tested |
| Down Arrow to reach Start/Pause | Tested |
| Up Arrow to return to the active emotion | Tested |
| Spacebar to start and pause | Tested |
| Information popups using keyboard | Tested |
| Mobile layout | Tested at different screen widths and on a phone |
| Desktop layout | Checked |

---

## Conclusion

Working on this feedback helped me improve my understanding of responsive design, animation performance, keyboard accessibility and React component structure.

I improved the mobile layout, popup positioning, background animation handling and keyboard controls. Users can now navigate between the five emotions, select colours, access information and control the animation using either a mouse or a keyboard.

I also reviewed the code and removed unnecessary parts to keep the implementation simple and maintainable.

Overall, I focused on addressing the feedback while preserving the original design and main functionality of the project.
