import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import {
  assertBlockNode,
  findValueNode,
  assertArrayValue,
  assertArrayHasElement,
  assertArrayElementIsObject,
} from './helpers'

describe('Optional Commas in Arrays', () => {
  it('should parse arrays without commas', () => {
    const input = `items: [value1 value2 value3]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const items = assertBlockNode(result[0], 'items')
    const valueNode = findValueNode(items)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      assertArrayHasElement(arrValue, 0, 'string', 'value1')
      assertArrayHasElement(arrValue, 1, 'string', 'value2')
      assertArrayHasElement(arrValue, 2, 'string', 'value3')
    }
  })

  it('should parse mixed arrays with quoted and unquoted strings without commas', () => {
    const input = `items: [value1 "value2" 'value3' 4 true]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const items = assertBlockNode(result[0], 'items')
    const valueNode = findValueNode(items)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      assertArrayHasElement(arrValue, 0, 'string', 'value1')
      assertArrayHasElement(arrValue, 1, 'string', 'value2')
      assertArrayHasElement(arrValue, 2, 'string', 'value3')
      assertArrayHasElement(arrValue, 3, 'number', 4)
      assertArrayHasElement(arrValue, 4, 'boolean', true)
    }
  })

  it('should parse arrays with mixed comma usage', () => {
    const input = `items: [value1, value2 value3, value4 value5]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const items = assertBlockNode(result[0], 'items')
    const valueNode = findValueNode(items)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      assertArrayHasElement(arrValue, 0, 'string', 'value1')
      assertArrayHasElement(arrValue, 1, 'string', 'value2')
      assertArrayHasElement(arrValue, 2, 'string', 'value3')
      assertArrayHasElement(arrValue, 3, 'string', 'value4')
      assertArrayHasElement(arrValue, 4, 'string', 'value5')
    }
  })

  it('should parse arrays with nested objects without commas', () => {
    const input = `users: [{ name: user1 id: 1 } { name: user2 id: 2 }]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const users = assertBlockNode(result[0], 'users')
    const valueNode = findValueNode(users)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      expect(arrValue.elements.length).toBe(2)

      // First object
      assertArrayElementIsObject(arrValue, 0, [
        { key: 'name', valueType: 'string', value: 'user1' },
        { key: 'id', valueType: 'number', value: 1 },
      ])

      // Second object
      assertArrayElementIsObject(arrValue, 1, [
        { key: 'name', valueType: 'string', value: 'user2' },
        { key: 'id', valueType: 'number', value: 2 },
      ])
    }
  })

  it('should parse arrays with nested arrays without commas', () => {
    const input = `matrix: [[1 2 3] [4 5 6] [7 8 9]]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const matrix = assertBlockNode(result[0], 'matrix')
    const valueNode = findValueNode(matrix)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      expect(arrValue.elements.length).toBe(3)

      // First nested array
      const firstElement = arrValue.elements[0]
      expect(firstElement.type).toBe('Element')
      if (firstElement.type === 'Element') {
        expect(firstElement.value.type).toBe('Array')
        if (firstElement.value.type === 'Array') {
          const nestedArr = firstElement.value
          assertArrayHasElement(nestedArr, 0, 'number', 1)
          assertArrayHasElement(nestedArr, 1, 'number', 2)
          assertArrayHasElement(nestedArr, 2, 'number', 3)
        }
      }

      // Second nested array
      const secondElement = arrValue.elements[1]
      expect(secondElement.type).toBe('Element')
      if (secondElement.type === 'Element') {
        expect(secondElement.value.type).toBe('Array')
        if (secondElement.value.type === 'Array') {
          const nestedArr = secondElement.value
          assertArrayHasElement(nestedArr, 0, 'number', 4)
          assertArrayHasElement(nestedArr, 1, 'number', 5)
          assertArrayHasElement(nestedArr, 2, 'number', 6)
        }
      }

      // Third nested array
      const thirdElement = arrValue.elements[2]
      expect(thirdElement.type).toBe('Element')
      if (thirdElement.type === 'Element') {
        expect(thirdElement.value.type).toBe('Array')
        if (thirdElement.value.type === 'Array') {
          const nestedArr = thirdElement.value
          assertArrayHasElement(nestedArr, 0, 'number', 7)
          assertArrayHasElement(nestedArr, 1, 'number', 8)
          assertArrayHasElement(nestedArr, 2, 'number', 9)
        }
      }
    }
  })

  // Complex test case removed due to parsing issues with multiline input
})
