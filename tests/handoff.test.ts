import { test, expect } from 'claude-code/testing'

const OUT: Record<string, string> = {
  'git rev-parse --show-toplevel': '/repo\n',
  'git branch --show-current': 'feat/x\n',
  'git log --oneline -10': 'abc123 add thing\n',
  'git status --short': ' M a.ts\n',
}

test('writes the note under the git root and shows the path', async ($, on) => {
  const writes: { path: string; text: string }[] = []
  let asked = ''
  on('process.run', ($, e) => {
    const out = OUT[e.argv.join(' ')]
    return { value: { exitCode: out === undefined ? 1 : 0, stdout: out ?? '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  on('model.fork', ($, e) => {
    asked = e.prompt
    return { value: { isAnswered: true as const, text: '# Handoff: x, today\n## Done\n', usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 } } }
  })
  on('fs.write', ($, e) => { writes.push(e); return { value: undefined } })

  const r = await $.command.run({ command: 'handoff', args: '', origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })
  const d = new Date()
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const path = `/repo/.claude/handoffs/${date}-feat-x.md`
  expect(asked).toContain('abc123 add thing')
  expect(asked).toContain('Open PR: none')
  expect(writes[0]?.path).toBe(path)
  expect(r.text).toContain(`start the next session with: read ${path}`)
})
