import { COLORS } from '@/lib/config';

type Props = {
  size?: number;
  /** Fill colour of the diamond. Defaults to the brand teal. */
  color?: string;
  /** Colour of the inner outline (usually the surface behind the icon). */
  inner?: string;
  className?: string;
  /** If provided, the icon is exposed to assistive tech with this label. */
  title?: string;
  style?: React.CSSProperties;
};

/**
 * The Mounas geometric brand mark: the teal diamond from the logo set.
 * Use this anywhere a small decorative brand flourish is needed — it replaces
 * the butterfly that is NOT part of the brand.
 */
export default function DiamondIcon({
  size = 24,
  color = COLORS.teal,
  inner = COLORS.cream,
  className,
  title,
  style,
}: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      <path d="M12 1.5 L22.5 12 L12 22.5 L1.5 12 Z" fill={color} />
      <path
        d="M12 6.5 L17.5 12 L12 17.5 L6.5 12 Z"
        fill="none"
        stroke={inner}
        strokeWidth="1.6"
      />
    </svg>
  );
}
