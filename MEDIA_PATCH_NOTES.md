Drip Studio media patch

Files to replace:
- functions/api/deploy.js
- functions/api/deploy-mobile.js
- src/ui/components/PreviewPane.tsx

What it fixes:
- stops dropping home/gate card1 during deploy
- writes image metadata for image cards
- writes mediaUrl for video and social cards
- previews image/video/social content inside the studio canvas
- points image previews to /ads/
