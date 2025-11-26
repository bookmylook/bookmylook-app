import type { Express } from "express";
import path from "path";

export function registerDownloadRoute(app: Express) {
  app.get('/get-android-build', (req, res) => {
    const filePath = path.resolve('/home/runner/workspace/BookMyLook-v13.zip');
    console.log('Download requested:', filePath);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Download failed:', err);
        res.status(500).send('Download failed');
      }
    });
  });
}
