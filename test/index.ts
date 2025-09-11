import * as path from 'path'
import * as Mocha from 'mocha'
import * as glob from 'glob'

export function run(): Promise<void> {
  // Create the mocha test
  const envTimeout = Number(process.env.POSTFIX_MOCHA_TIMEOUT || '0')
  const envRetries = Number(process.env.POSTFIX_MOCHA_RETRIES || '0')
  const mocha = new Mocha({ ui: 'tdd', color: true })

  // Allow slower environments to stabilize (configurable via env)
  mocha.timeout(envTimeout > 0 ? envTimeout : 180000) // default 3 minutes
  mocha.retries(envRetries > 0 ? envRetries : 3)

  const testsRoot = path.resolve(__dirname, '..')

  return new Promise((c, e) => {
    glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) {
        return e(err)
      }

      // Add files to the test suite
      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)))

      try {
        // Run the mocha test
        mocha.run(failures => {
          if (failures > 0) {
            e(new Error(`${failures} tests failed.`))
          } else {
            c()
          }
        })
      } catch (err) {
        console.error(err)
        e(err)
      }
    })
  })
}
