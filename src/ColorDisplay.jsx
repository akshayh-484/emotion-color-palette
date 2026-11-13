// Shows the big gradient card — emotion name and description.
// The actual gradient colours come from CSS variables set in App.jsx.

export default function ColorDisplay({ emotion }) {
  return (
    <section className="display" aria-live="polite" aria-atomic="true">
      <div className="display__hero">

        {/* soft light overlay inside the card */}
        <div className="display__glow" aria-hidden="true" />

        {/* key forces React to re-mount these when the emotion changes,
            which replays the slide-up animation each time */}
        <span key={`label-${emotion.id}`} className="display__eyebrow">
          Selected emotion
        </span>

        <h2 key={`name-${emotion.id}`} className="display__name">
          {emotion.name}
        </h2>

        <p key={`tag-${emotion.id}`} className="display__tagline">
          {emotion.tagline}
        </p>

      </div>
    </section>
  );
}
