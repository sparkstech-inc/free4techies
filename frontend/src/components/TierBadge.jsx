// TierBadge — monochrome label for a resource's free tier type.
// Differentiated by fill/border style, not color (B/W theme).
export default function TierBadge({ tier }) {
  const labels = {
    'free-tier': 'Free Tier',
    'free-trial': 'Free Trial',
    'free-forever': 'Free Forever',
    'open-source': 'Open Source',
  };
  return (
    <span className={`badge-tier-${tier}`}>
      {labels[tier] || tier}
    </span>
  );
}
