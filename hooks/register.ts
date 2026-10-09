import type { Register } from 'claude-code'

export const register: Register = (on, options) => {
  on('session.start', async ($, e, next) => {
    await $.command.register({ name: 'handoff', description: 'Write a handoff note for a fresh session.' })
    return next(e)
  })

  on('command.run', { command: 'handoff' }, async $ => {
    const sh = async (...argv: string[]) => {
      const r = await $.process.run(argv).catch(() => undefined)
      return r && r.exitCode === 0 ? r.stdout.trim() : ''
    }
    const root = await sh('git', 'rev-parse', '--show-toplevel')
    if (!root) return { text: 'handoff: not inside a git repo.' }

    const branch = (await sh('git', 'branch', '--show-current')) || 'detached'
    const facts = [
      `Branch: ${branch}`,
      `git log --oneline -10:\n${await sh('git', 'log', '--oneline', '-10')}`,
      `git status --short:\n${(await sh('git', 'status', '--short')) || '(clean)'}`,
      `Open PR: ${(await sh('gh', 'pr', 'view', '--json', 'number,title,url')) || 'none'}`,
    ].join('\n\n')
    const d = new Date()
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const ask =
      `Write a handoff note so a fresh Claude session can continue this work. ` +
      `Format: first line "# Handoff: <topic>, ${date}", then sections "## Done" ` +
      `(include PR numbers and merge commits where known), "## Next", and "## Gotchas". ` +
      `Be concise and concrete. Output only the markdown.\n\nRepo facts:\n${facts}`

    // fork reads the session's own conversation; before the first reply there is none.
    let r = await $.model.fork({ prompt: ask })
    if (!r.isAnswered && r.reason === 'nothing-to-fork')
      r = await $.model.complete({ model: await $.session.model(), prompt: ask })
    if (!r.isAnswered) return { text: `handoff: model gave no note (${r.reason}).` }

    const path = `${root}/${options.dir}/${date}-${branch.replace(/[^\w.-]+/g, '-')}.md`
    await $.fs.write(path, r.text.trim() + '\n')
    return { text: `Handoff saved: ${path}\nstart the next session with: read ${path}` }
  })
}
