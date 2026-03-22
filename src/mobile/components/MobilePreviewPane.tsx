import type { PageSpec } from "../../core/types";
import { toMobileBlocks } from "../mobileLayoutPresets";
import { PreviewPane } from "../../ui/components/PreviewPane";

export function MobilePreviewPane({ page }: { page: PageSpec }) {
  const mobilePage: PageSpec = {
    ...page,
    blocks: toMobileBlocks(page.blocks)
  };

   return (
    <>
      <style>{`
        /* Mobile preview was "frozen" because shared CSS sets .previewStage{ overflow:hidden }.
           Override ONLY for mobile mode so the page can scroll vertically. */
        .previewShell.mobile .previewStage.mobile{
          overflow-y: auto !important;
          overflow-x: hidden !important;
          -webkit-overflow-scrolling: touch;
          touch-action: pan-y;
          overscroll-behavior: contain;
        }
      `}</style>

      <PreviewPane page={mobilePage} mode="mobile" />
    </>
  );
}
