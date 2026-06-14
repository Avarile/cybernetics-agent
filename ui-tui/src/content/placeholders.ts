import { pick } from '../lib/text.js'

export const PLACEHOLDERS = [
  'Ask me anything…',
  'Try "Let us discuss about your business ideas"',
  'Try "If you have an idea of AI automation, ask Av"',
  'Try "Discuss with me about your project"',
  'Try "/help" for commands',
  'Try "I can help you with the marketing, talk to me"',
  'Try "Do you need help with how to use me?"'
]

export const PLACEHOLDER = pick(PLACEHOLDERS)
