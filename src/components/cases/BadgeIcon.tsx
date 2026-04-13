interface BadgeIconProps {
  iconUrl: string | null | undefined;
  name?: string;
  className?: string;
}

function isSvgString(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.startsWith('<svg') || trimmed.startsWith('<?xml');
}

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg.trim());
  return `data:image/svg+xml,${encoded}`;
}

export function BadgeIcon({ iconUrl, name, className = 'w-8 h-8' }: BadgeIconProps) {
  if (!iconUrl || iconUrl.trim() === '') return null;

  const src = isSvgString(iconUrl) ? svgToDataUri(iconUrl) : iconUrl;

  return (
    <img
      src={src}
      alt={name || 'badge'}
      className={className}
      style={{ imageRendering: 'auto' }}
    />
  );
}
