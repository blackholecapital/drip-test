import type { BlockSpec } from "../core/types";

export const MOBILE_CANVAS = { width: 430, height: 860 } as const;

export function toMobileBlocks(blocks: BlockSpec[]): BlockSpec[] {
  const baseWidth = 1400;
  const spacing = 18;
  const margin = 18;
  const cardWidth = MOBILE_CANVAS.width - margin * 2;

  return blocks.map((block, index) => {
    const scaledHeight = Math.max(160, Math.round((block.h / baseWidth) * 980));
    return {
      id: block.id,
      x: margin,
      y: margin + index * (scaledHeight + spacing),
      w: cardWidth,
      h: scaledHeight
    };
  });
}
