import * as path from 'path'
import { runTests } from '@vscode/test-electron'

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../')
    const extensionTestsPath = path.resolve(__dirname, './index')

    const opts: any = { extensionDevelopmentPath, extensionTestsPath }
    const fromEnv = process.env.VSCODE_EXECUTABLE_PATH
    if (fromEnv && fromEnv.trim()) {
      let exe = fromEnv
      if (process.platform === 'win32' && /\\bin\\code$/i.test(exe)) {
        exe += '.cmd'
      }
      opts.vscodeExecutablePath = exe
      console.log(`Using VS Code from env: ${exe}`)
    }

    await runTests(opts)
  } catch (err) {
    console.error('Failed to run tests:', err)
    process.exit(1)
  }
}

main()
