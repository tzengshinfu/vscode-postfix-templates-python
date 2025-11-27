/* @ts-check */
import { copyFile, mkdir } from 'node:fs/promises'
import * as console from 'node:console'

/**
 * Copy tree-sitter wasm files to specified directory
 * @param {string} targetDir - Target directory for wasm files
 */
export async function copyTreeSitterWasm(targetDir = 'out') {
  try {
    await mkdir(targetDir, { recursive: true })
    await copyFile(
      'node_modules/web-tree-sitter/tree-sitter.wasm',
      `${targetDir}/tree-sitter.wasm`
    )
    console.log(`✓ Copied tree-sitter.wasm to ${targetDir} directory`)
    await copyFile(
      'node_modules/tree-sitter-python/tree-sitter-python.wasm',
      `${targetDir}/tree-sitter-python.wasm`
    )
    console.log(`✓ Copied tree-sitter-python.wasm to ${targetDir} directory`)
  } catch (error) {
    console.error(`Failed to copy tree-sitter wasm files to ${targetDir}:`, error)
  }
}

/**
 * Create esbuild plugin for copying tree-sitter wasm files
 * @param {string} targetDir - Target directory for wasm files
 */
export function createCopyWasmPlugin(targetDir = 'out') {
  return {
    name: 'copy-wasm',
    setup(build) {
      build.onEnd(() => copyTreeSitterWasm(targetDir))
    }
  }
}
