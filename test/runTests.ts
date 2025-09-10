import * as path from 'path'
import * as fs from 'fs'

import { runTests } from '@vscode/test-electron'

function findVSCodeExecutable(): string {
  // Try different possible VS Code paths
  const possiblePaths = [
    'C:\\Users\\tzeng\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
    'C:\\Users\\tzeng\\AppData\\Local\\Programs\\Microsoft VS Code\\bin\\code.cmd',
    'C:\\Program Files\\Microsoft VS Code\\Code.exe',
    'C:\\Program Files\\Microsoft VS Code\\bin\\code.cmd',
    'code', // Try system PATH
  ]

  for (const vscodePath of possiblePaths) {
    try {
      if (fs.existsSync(vscodePath) || vscodePath === 'code') {
        console.log(`Using VS Code at: ${vscodePath}`)
        return vscodePath
      }
    } catch (error) {
      // Continue to next path
    }
  }

  throw new Error('Could not find VS Code executable. Please ensure VS Code is installed.')
}

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, '../')

    // The path to the extension test script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, './index')

    // Find VS Code executable
    const vscodeExecutablePath = findVSCodeExecutable()

    // Use local VS Code installation instead of downloading
    await runTests({ 
      vscodeExecutablePath,
      extensionDevelopmentPath, 
      extensionTestsPath 
    })
  } catch (err) {
    console.error('Failed to run tests:', err)
    process.exit(1)
  }
}

main()
