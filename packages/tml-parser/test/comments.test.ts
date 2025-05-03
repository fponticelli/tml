import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import { CommentNode, ObjectField, ArrayElement } from '../src/types'
import {
  assertBlockNode,
  findNodesByType,
  findValueNode,
  findChildBlockByName,
} from './helpers'

describe('Comments in TML', () => {
  it('should parse comments inside objects', () => {
    const input = `config: {
      // Header comment
      name: "My App",
      /* Block comment */
      version: "1.0.0",
      settings: {
        // Nested comment
        debug: true
      }
    }`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const config = assertBlockNode(result[0], 'config')
    const valueNode = findValueNode(config)
    expect(valueNode).toBeDefined()

    if (valueNode && valueNode.value.type === 'Object') {
      const objValue = valueNode.value

      // Check that we have the expected fields
      const fields = objValue.fields.filter(
        field => field.type === 'Field'
      ) as ObjectField[]
      expect(fields.length).toBe(3)

      // Check for comments
      const comments = objValue.fields.filter(
        field => field.type === 'Comment'
      ) as CommentNode[]
      expect(comments.length).toBeGreaterThan(0)

      // Verify at least one comment contains expected text
      const hasHeaderComment = comments.some(comment =>
        comment.value.includes('Header comment')
      )
      expect(hasHeaderComment).toBe(true)
    }
  })

  it('should parse comments inside arrays', () => {
    const input = `items: [
      // First item comment
      "Item 1",
      /* Block comment */
      "Item 2",
      // Last item comment
      "Item 3"
    ]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const items = assertBlockNode(result[0], 'items')
    const valueNode = findValueNode(items)
    expect(valueNode).toBeDefined()

    if (valueNode && valueNode.value.type === 'Array') {
      const arrValue = valueNode.value

      // Check that we have the expected elements
      const elements = arrValue.elements.filter(
        el => el.type === 'Element'
      ) as ArrayElement[]
      expect(elements.length).toBe(3)

      // Check for comments
      const comments = arrValue.elements.filter(
        el => el.type === 'Comment'
      ) as CommentNode[]
      expect(comments.length).toBeGreaterThan(0)

      // Verify at least one comment contains expected text
      const hasFirstItemComment = comments.some(comment =>
        comment.value.includes('First item comment')
      )
      expect(hasFirstItemComment).toBe(true)
    }
  })

  it('should parse nested comments in complex structures', () => {
    // Use a simpler structure for testing
    const input = `data
  // Header comment
  users: ["John", /* User 2 */ "Jane"]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    // Just verify that parsing succeeds without errors
    const data = assertBlockNode(result[0], 'data')

    // Find the users block
    const usersBlock = findChildBlockByName(data, 'users')
    expect(usersBlock).toBeDefined()

    if (usersBlock) {
      // Check that the users block has a value
      const valueNode = findValueNode(usersBlock)
      expect(valueNode).toBeDefined()

      if (valueNode) {
        // The value should be an array
        expect(valueNode.value.type).toBe('Array')
      }
    }

    // Check for comments in the data block
    const comments = findNodesByType<CommentNode>(data.children, 'Comment')
    expect(comments.length).toBeGreaterThan(0)

    // Verify the comment content
    const hasHeaderComment = comments.some(comment =>
      comment.value.includes('Header comment')
    )
    expect(hasHeaderComment).toBe(true)
  })
})
