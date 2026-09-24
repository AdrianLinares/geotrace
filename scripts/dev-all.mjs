import { spawn } from 'node:child_process'

const commands = [
  ['pnpm', ['run', 'dev:server']],
  ['pnpm', ['exec', 'vite']],
]

const children = commands.map(([command, args]) => {
  const child = spawn(command, args, { stdio: 'inherit', env: process.env })
  child.on('error', (error) => {
    console.error(`Unable to start ${command} ${args.join(' ')}:`, error.message)
    process.exitCode = 1
  })
  return child
})

let stopping = false
const stop = (signal) => {
  if (stopping) return
  stopping = true
  for (const child of children) child.kill(signal)
}

process.once('SIGINT', () => stop('SIGINT'))
process.once('SIGTERM', () => stop('SIGTERM'))

await Promise.all(children.map((child) => new Promise((resolve) => child.once('exit', resolve))))
