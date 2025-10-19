import * as path from 'path'
import * as Mocha from 'mocha'
import * as glob from 'glob'

export async function run(): Promise<void> {
  /* Create the mocha test */
  const envTimeout = Number(process.env.POSTFIX_MOCHA_TIMEOUT || '0')
  const envRetries = Number(process.env.POSTFIX_MOCHA_RETRIES || '0')
  const mocha = new Mocha({ ui: 'tdd', color: true })


  // Filter out noisy non-test logs in Debug Console
  const originalError = console.error.bind(console)
  const originalLog = console.log.bind(console)
  const suppressPatterns = [
    /Model is disposed!/i,
    /vscode-file:\/\//i,
    /electron.*NODE_OPTION/i
  ]
  const shouldSuppress = (msg: any) => suppressPatterns.some(r => ('' + msg).match(r))
  console.error = (...args: any[]) => {
    if (args.some(shouldSuppress)) return
    originalError(...args)
  }
  console.log = (...args: any[]) => {
    if (args.some(shouldSuppress)) return
    originalLog(...args)
  }

  // Also filter low-level stdout/stderr writes
  const patterns = suppressPatterns
  const wrapWrite = (stream: NodeJS.WriteStream) => {
    const orig: any = (stream as any).write.bind(stream)
    ;(stream as any).write = (chunk: any, encoding?: any, cb?: any) => {
      try {
        const s = typeof chunk === 'string' ? chunk : String(chunk)
        if (patterns.some(r => r.test(s))) return true
      } catch {}
      return orig(chunk, encoding, cb)
    }
  }
  wrapWrite(process.stdout)
  wrapWrite(process.stderr)


  // Optional: reporter (e.g., 'min' to show only failures)
  const envReporter = String(process.env.POSTFIX_MOCHA_REPORTER || '').trim()
  if (envReporter) {
    try { mocha.reporter(envReporter as any) } catch { /* ignore invalid reporter */ }
  }

  /* Optional: fail fast and/or filter tests via env vars */
  const envBail = String(process.env.POSTFIX_MOCHA_BAIL || '').trim()
  if (envBail && envBail !== '0' && envBail.toLowerCase() !== 'false') {
    mocha.bail(true)
  }

  const envGrep = String(process.env.POSTFIX_MOCHA_GREP || '').trim()
  if (envGrep) {
    mocha.grep(envGrep)
  }

  const envInvert = String(process.env.POSTFIX_MOCHA_INVERT || '').trim()
  if (envInvert && envInvert !== '0' && envInvert.toLowerCase() !== 'false') {
    mocha.invert()
  }

  /* Allow slower environments to stabilize (configurable via env) */
  mocha.timeout(envTimeout > 0 ? envTimeout : 180000) /* default 3 minutes */
  mocha.retries(envRetries > 0 ? envRetries : 3)

  const testsRoot = path.resolve(__dirname, '..')

  return new Promise((c, e) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err)
      }

      /* Add files to the test suite */
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)))

      try {
        /* Run the mocha test */
        const runner = mocha.run(failures => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`))
          } else {
            c()
          }
        })

        /* Print failure details immediately when they happen */
        runner.on('fail', (test, err) => {
          try {
            console.error(`\n[FAIL] ${test.fullTitle()}`)
            if (err && (err as any).message) {
              console.error((err as any).message)
            }
            if (err && (err as any).stack) {
              console.error((err as any).stack)
            }
          } catch (_) {
            /* noop */
          }
        })
      } catch (err) {
        console.error(err)
        e(err)
      }
    })
  })
}
