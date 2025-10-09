import * as path from 'path'
import * as fs from 'fs'

import { runTests } from '@vscode/test-electron'

function findVSCodeExecutable(): string {
  /* Honour explicit override first */
  const fromEnv = process.env.VSCODE_EXECUTABLE_PATH
    ? path.normalize(process.env.VSCODE_EXECUTABLE_PATH)
    : undefined

  const userProfile = process.env.USERPROFILE
    ? path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Programs', 'Microsoft VS Code')
    : undefined
  const programFiles = process.env.ProgramFiles
    ? path.join(process.env.ProgramFiles, 'Microsoft VS Code')
    : 'C:\\Program Files\\Microsoft VS Code'

  /* Try different possible VS Code paths */
  const possiblePaths = [
    fromEnv,
    userProfile && path.join(userProfile, 'bin', 'code'),
    userProfile && path.join(userProfile, 'bin', 'code.cmd'),
    userProfile && path.join(userProfile, 'Code.exe'),
    path.join(programFiles, 'Code.exe'),
    path.join(programFiles, 'bin', 'code'),
    path.join(programFiles, 'bin', 'code.cmd'),
    'code', /* Try system PATH */
  ].filter(Boolean) as string[]

  for (const vscodePath of possiblePaths) {
    try {
      if (vscodePath === 'code' || fs.existsSync(vscodePath)) {
        console.log(`Using VS Code at: ${vscodePath}`)
        return vscodePath
      }
    } catch (error) {
      /* Continue to next path */
    }
  }

  throw new Error('Could not find VS Code executable. Please ensure VS Code is installed.')
}

async function main() {
  try {
    /* The folder containing the Extension Manifest package.json */
    /* Passed to `--extensionDevelopmentPath` */
    const extensionDevelopmentPath = path.resolve(__dirname, '../')

    /* The path to the extension test script */
    /* Passed to --extensionTestsPath */
    const extensionTestsPath = path.resolve(__dirname, './index')

    /* Find VS Code executable */
    const vscodeExecutablePath = findVSCodeExecutable()

    /* Use local VS Code installation instead of downloading */
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
