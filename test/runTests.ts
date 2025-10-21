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

  // Work around Electron rejecting NODE_OPTIONS in packaged app
  try { delete process.env.NODE_OPTIONS } catch {}

  // On Windows prefer the CLI script to avoid ENOENT with Code.exe from archives
  if (process.platform === 'win32' && !opts.vscodeExecutablePath) {
    try {
      const { downloadAndUnzipVSCode } = require('@vscode/test-electron')
      const version = opts.version || '1.104.3'
      const vsPath: string = await downloadAndUnzipVSCode(version)
      const cli = path.resolve(vsPath, 'bin', 'code.cmd')
      if (existsSync(cli)) {
        opts.vscodeExecutablePath = cli
        console.log(`Using VS Code CLI: ${cli}`)
      }
    } catch { /* ignore */ }
  }

  // Suppress/limit very long noisy lines to avoid FINDSTR "lines too long"
  try {
    const MAX = Number(process.env.POSTFIX_MAX_FINDSTR_LINE || '8000')
    const patterns = [
      /Model is disposed!:/i,
      /vscode-file:/i,
      /Can only set when there is a listener! This is to prevent leaks.:/i
    ]
    const wrap = (stream: NodeJS.WriteStream) => {
      const orig: any = (stream as any).write.bind(stream)
      let buf = ''
      ;(stream as any).write = (chunk: any, encoding?: any, cb?: any) => {
        try {
          const s = typeof chunk === 'string' ? chunk : (chunk ? chunk.toString(encoding || 'utf8') : '')
          buf += s
          let idx: number
          while ((idx = buf.indexOf('\n')) !== -1) {
            const line = buf.slice(0, idx)
            buf = buf.slice(idx + 1)
            if (patterns.some(r => r.test(line))) { continue }
            if (line.length <= MAX) {
              orig(line + '\n')
            } else {
              for (let i = 0; i < line.length; i += MAX) {
                orig(line.slice(i, i + MAX) + '\n')
              }
            }
          }
          return true
        } catch {
          return orig(chunk, encoding, cb)
        }
      }
    }
    wrap(process.stdout)
    wrap(process.stderr)
  } catch { /* ignore */ }

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
