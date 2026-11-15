import type { CSSProperties } from 'react'

/** Checkerboard background so translucent colors are visible. */
export const checker: CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, #8884 25%, transparent 25%, transparent 75%, #8884 75%), linear-gradient(45deg, #8884 25%, transparent 25%, transparent 75%, #8884 75%)',
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 6px 6px',
}
