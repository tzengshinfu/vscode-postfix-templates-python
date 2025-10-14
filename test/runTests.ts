import * as path from 'path'
import { runTests } from '@vscode/test-electron'
import { existsSync } from 'fs'
import { globSync } from 'glob'

async function main() {
  const extensionDevelopmentPath = path.resolve(__dirname, '../')
  const extensionTestsPath = path.resolve(__dirname, './index')

  const opts: any = { extensionDevelopmentPath, extensionTestsPath }
  const fromEnv = process.env.VSCODE_EXECUTABLE_PATH
  const versionFromEnv = (process.env.VSCODE_TEST_VERSION || '').trim()
  if (!fromEnv || !fromEnv.trim()) {
    opts.version = versionFromEnv || '1.104.3'
  }
  if (fromEnv && fromEnv.trim()) {
    let exe = fromEnv
    if (process.platform === 'win32' && /\\bin\\code$/i.test(exe)) {
      exe += '.cmd'
    }
    opts.vscodeExecutablePath = exe
    console.log(`Using VS Code from env: ${exe}`)
  }

  try {
    await runTests(opts)
  } catch (err: any) {
    try {
      if (process.platform === 'win32') {
        const matches = globSync('.vscode-test/**/code*.cmd', { windowsPathsNoEscape: true })
        const candidate = matches.find(p => /\\code\.cmd$/i.test(p)) || matches[0]
        if (candidate && existsSync(candidate)) {
          opts.vscodeExecutablePath = path.resolve(candidate)
          console.log(`Retrying with VS Code: ${opts.vscodeExecutablePath}`)
          await runTests(opts)
          return
        }
      }
    } catch { /* ignore and fall through */ }
    console.error('Failed to run tests:', err)
    process.exit(1)
  }
}

main()
