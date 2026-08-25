// TierBadge - color-coded label for a resource's free tier type.
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
