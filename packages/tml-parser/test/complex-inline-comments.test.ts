import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import {
  BlockNode,
  CommentNode,
  Node,
  ValueNode,
  StringValue,
} from '../src/types'

describe('Complex Inline Multiline Block Comments', () => {
  it('should correctly parse multiple inline multiline block comments', () => {
    const input = `html
  head /* First comment
    spanning multiple lines */
    title /* Another comment
    with multiple lines */: "My Page"
  body
    p /* Third comment
    also multiline */: "Content"`

    // Parse the input
    const result = parseTML(input)

    // There should be one root block (html)
    expect(result.length).toBe(1)

    // Find all comments in the result
    const comments = findAllComments(result)
    expect(comments.length).toBe(3)

    // Check the first comment
    expect(comments[0].isLineComment).toBe(false)
    expect(comments[0].value).toBe('First comment\n    spanning multiple lines')

    // Check the second comment
    expect(comments[1].isLineComment).toBe(false)
    expect(comments[1].value).toBe('Another comment\n    with multiple lines')

    // Check the third comment
    expect(comments[2].isLineComment).toBe(false)
    expect(comments[2].value).toBe('Third comment\n    also multiline')

    // Check that the title block has a value
    const html = result[0] as BlockNode
    const head = html.children.find(
      child => child.type === 'Block' && (child as BlockNode).name === 'head'
    ) as BlockNode
    expect(head).toBeDefined()

    const title = head.children.find(
      child => child.type === 'Block' && (child as BlockNode).name === 'title'
    ) as BlockNode
    expect(title).toBeDefined()

    const titleValue = title.children.find(
      child => child.type === 'Value'
    ) as ValueNode
    expect(titleValue).toBeDefined()
    expect(titleValue.value.type).toBe('String')
    expect((titleValue.value as StringValue).value).toBe('My Page')

    // Check that the p block has a value
    const body = html.children.find(
      child => child.type === 'Block' && (child as BlockNode).name === 'body'
    ) as BlockNode
    expect(body).toBeDefined()

    const p = body.children.find(
      child => child.type === 'Block' && (child as BlockNode).name === 'p'
    ) as BlockNode
    expect(p).toBeDefined()

    const pValue = p.children.find(child => child.type === 'Value') as ValueNode
    expect(pValue).toBeDefined()
    expect(pValue.value.type).toBe('String')
    expect((pValue.value as StringValue).value).toBe('Content')
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
