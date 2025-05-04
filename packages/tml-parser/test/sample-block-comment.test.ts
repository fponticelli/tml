import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { parseTML } from '../src'
import { CommentNode, Node } from '../src/types'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

describe('Sample File Block Comment', () => {
  it('should correctly parse the multiline block comment in the sample file', () => {
    // Read the sample file
    const samplePath = path.resolve(
      __dirname,
      '../../tml-vscode/examples/sample.tml'
    )
    const sampleContent = fs.readFileSync(samplePath, 'utf8')

    // Parse the file
    const result = parseTML(sampleContent)

    // Find all comments in the result
    const comments = findAllComments(result)

    // Find the block comment
    const blockComments = comments.filter(comment => !comment.isLineComment)
    expect(blockComments.length).toBe(1)

    // Check the block comment content
    const blockComment = blockComments[0]
    expect(blockComment.value).toBe(
      'This is a block comment\n       that spans multiple lines'
    )

    // Check the position
    expect(blockComment.position?.start.line).toBe(32)
    expect(blockComment.position?.end.line).toBe(33)
  })
})

// Helper function to find all comments in a node tree
function findAllComments(nodes: Node[]): CommentNode[] {
  const comments: CommentNode[] = []

  function traverse(node: Node) {
    if (node.type === 'Comment') {
      comments.push(node as CommentNode)
    }

    if ('children' in node && Array.isArray(node.children)) {
      node.children.forEach(traverse)
    }
  }

  nodes.forEach(traverse)
  return comments
}
