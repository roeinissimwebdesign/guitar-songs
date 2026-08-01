// Publishes dist/ to the gh-pages branch, which is what GitHub Pages serves.
// Run with: npm run deploy
import { execFileSync } from 'node:child_process'
import { mkdtempSync, cpSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' }).trim()

const stage = mkdtempSync(join(tmpdir(), 'gh-pages-'))
cpSync(join(root, 'dist'), stage, { recursive: true })
writeFileSync(join(stage, '.nojekyll'), '')

const git = (...args) => execFileSync('git', args, { cwd: stage, stdio: 'inherit' })
git('init', '-q', '-b', 'gh-pages')
git('add', '-A')
git('-c', 'user.name=Roei Nissim', '-c', 'user.email=nissimroei@gmail.com', 'commit', '-q', '-m', 'build')
git('remote', 'add', 'origin', remote)
git('push', '-q', '-f', 'origin', 'gh-pages')

rmSync(stage, { recursive: true, force: true })
console.log('נפרס: https://roeinissimwebdesign.github.io/guitar-songs/')
