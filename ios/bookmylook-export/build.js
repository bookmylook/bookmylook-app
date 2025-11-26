import * as esbuild from 'esbuild';
import pathAliasPlugin from 'esbuild-plugin-path-alias';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

await esbuild.build({
  entryPoints: ['server/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: 'dist',
  packages: 'external',
  keepNames: true,
  plugins: [
    pathAliasPlugin({
      '@db': path.resolve(__dirname, 'server/db.ts'),
      '@shared': path.resolve(__dirname, 'shared'),
    }),
  ],
  banner: {
    js: `import { createRequire } from 'module';
const require = createRequire(import.meta.url);
`,
  },
});

console.log('✅ Server build complete');
