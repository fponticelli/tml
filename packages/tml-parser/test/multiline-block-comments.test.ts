import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import { CommentNode, Node } from '../src/types'
import { findNodesByType } from './helpers'

describe('Multiline Block Comments', () => {
  it('should parse a standalone multiline block comment', () => {
    const input = `/* This is a block comment
    that spans multiple lines */`

    const result = parseTML(input)

    // Check that we have a comment node
    const commentNodes = findNodesByType<CommentNode>(result, 'Comment')
    expect(commentNodes.length).toBe(1)

    // Check the comment content
    const comment = commentNodes[0]
    expect(comment.isLineComment).toBe(false)
    expect(comment.value).toBe(
      'This is a block comment\n    that spans multiple lines'
    )
  })

  it('should parse a multiline block comment within a document', () => {
    const input = `html
  head
    title: My Page
  /* This is a block comment
     that spans multiple lines */
  body
    p: Content`

    const result = parseTML(input)

    // Check that we have at least one node (the html block)
    expect(result.length).toBe(1)

    // Find all comment nodes
    const allComments = findAllComments(result)
    expect(allComments.length).toBe(1)

    // Check the comment content
    const comment = allComments[0]
    expect(comment.isLineComment).toBe(false)
    expect(comment.value).toBe(
      'This is a block comment\n     that spans multiple lines'
    )
  })

  it('should parse multiple block comments in a document', () => {
    const input = `/* First comment
       spanning multiple lines */
html
  /* Second comment
     also multiline */
  head
    title: My Page
  body
    /* Third comment
       with multiple lines */
    p: Content`

    const result = parseTML(input)

    // Find all comment nodes
    const allComments = findAllComments(result)
    expect(allComments.length).toBe(3)

    // Check the first comment
    expect(allComments[0].isLineComment).toBe(false)
    expect(allComments[0].value).toBe(
      'First comment\n       spanning multiple lines'
    )

    // Check the second comment
    expect(allComments[1].isLineComment).toBe(false)
    expect(allComments[1].value).toBe('Second comment\n     also multiline')

    // Check the third comment
    expect(allComments[2].isLineComment).toBe(false)
    expect(allComments[2].value).toBe(
      'Third comment\n       with multiple lines'
    )
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
