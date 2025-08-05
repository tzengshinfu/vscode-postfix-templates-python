import esbuild from 'esbuild'
import * as process from "node:process";
import * as console from "node:console";
import { copyFile, mkdir } from 'node:fs/promises';

const production = process.argv.includes("--production")
const watch = process.argv.includes("--watch")

// Plugin to copy tree-sitter.wasm & tree-sitter-python.wasm
const copyParserPlugin = {
  name: 'copy-wasm',
  setup(build) {
    build.onEnd(async () => {
      try {
        await mkdir('out', { recursive: true });
        await copyFile(
          'node_modules/web-tree-sitter/tree-sitter.wasm',
          'out/tree-sitter.wasm'
        );
        await copyFile(
          'node_modules/tree-sitter-python/tree-sitter-python.wasm',
          'out/tree-sitter-python.wasm'
        );
        console.log('✓ Copied tree-sitter.wasm to out directory');
        console.log('✓ Copied tree-sitter-python.wasm to out directory');
      } catch (error) {
        console.error('Failed to copy tree-sitter.wasm:', error);
        console.error('Failed to copy tree-sitter-python.wasm:', error);
      }
    });
  }
};

/** @type {esbuild.BuildOptions} */
const options = {
  entryPoints: ["./src/extension.ts"],
  bundle: true,
  outdir: "out",
  external: ["vscode"],
  format: "cjs",
  sourcemap: !production,
  minify: production,
  platform: "node",
  logLevel: 'info',
  // needed for debugger
  keepNames: true,
  // needed for vscode-* deps
  mainFields: ['module', 'main'],
  plugins: [copyParserPlugin]
};

(async function () {
  try {
    if (watch) {
      const ctx = await esbuild.context(options)
      await ctx.watch()
    } else {
      await esbuild.build(options);
    }
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
})()
