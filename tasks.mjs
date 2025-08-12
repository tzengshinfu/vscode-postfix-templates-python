//@ts-check
import * as process from 'node:process'
import * as console from 'node:console'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { copyTreeSitterWasm } from './wasm-utils.mjs'

const LANGUAGE = 'postfix'

async function pretest() {
  const pkg = readPackageJson()
  pkg.contributes.languages = [{ id: LANGUAGE }]
  // Activate the extension right after start to avoid delay and failure in first test
  pkg.activationEvents = ['*']
  // Don't use bundler for tests as it breaks template usage tests
  pkg.main = './src/extension'
  writePackageJson(pkg)

  // Copy tree-sitter wasm files to out/out directory
  await copyTreeSitterWasm('out/out')
}


const writePackageJson = (content) => {
  mkdirSync('./out', { recursive: true, })
  writeFileSync('./out/package.json', JSON.stringify(content, undefined, '\t'))
}
const readPackageJson = () => JSON.parse(readFileSync('package.json', 'utf8'))

const taskToExecute = { pretest }[process.argv[2] ?? '']
if (taskToExecute) {
  taskToExecute().catch(console.error)
}
