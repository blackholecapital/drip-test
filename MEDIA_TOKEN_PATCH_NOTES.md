Drip Studio media patch

Preview behavior:
- image cards render /ads/<code>.png by default
- image cards preserve explicit filenames like A1.jpg
- video cards preview the raw URL in a video element
- social cards preview the raw URL in an iframe

Deploy behavior:
- runtime blocks now preserve kind
- image cards emit image
- video and social cards emit mediaUrl
- non-text cards no longer use the media token as the card title

Files changed:
- src/ui/components/PreviewPane.tsx
- functions/api/deploy.js
- functions/api/deploy-mobile.js
