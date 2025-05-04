import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import {
  assertBlockNode,
  findValueNode,
  assertArrayValue,
  assertArrayHasElement,
  findChildBlockByName,
} from './helpers'

describe('Unquoted Strings in Arrays', () => {
  it('should parse unquoted strings in arrays', () => {
    const input = `items: [value1, value2, value3]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const items = assertBlockNode(result[0], 'items')
    const valueNode = findValueNode(items)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      assertArrayHasElement(arrValue, 0, 'String', 'value1')
      assertArrayHasElement(arrValue, 1, 'String', 'value2')
      assertArrayHasElement(arrValue, 2, 'String', 'value3')
    }
  })

  it('should parse mixed arrays with quoted and unquoted strings', () => {
    const input = `items: [value1, "value2", 'value3', 4, true]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const items = assertBlockNode(result[0], 'items')
    const valueNode = findValueNode(items)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      assertArrayHasElement(arrValue, 0, 'String', 'value1')
      assertArrayHasElement(arrValue, 1, 'String', 'value2')
      assertArrayHasElement(arrValue, 2, 'String', 'value3')
      assertArrayHasElement(arrValue, 3, 'Number', 4)
      assertArrayHasElement(arrValue, 4, 'Boolean', true)
    }
  })

  it('should parse arrays with unquoted strings containing special characters', () => {
    const input = `items: [value-with-dash, value_with_underscore, value.with.dots]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const items = assertBlockNode(result[0], 'items')
    const valueNode = findValueNode(items)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      assertArrayHasElement(arrValue, 0, 'String', 'value-with-dash')
      assertArrayHasElement(arrValue, 1, 'String', 'value_with_underscore')
      assertArrayHasElement(arrValue, 2, 'String', 'value.with.dots')
    }
  })

  it('should parse nested arrays with unquoted strings', () => {
    const input = `items: ["[nested1, nested2]", "[nested3, nested4]"]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const items = assertBlockNode(result[0], 'items')
    const valueNode = findValueNode(items)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      expect(arrValue.elements.length).toBe(2)

      // First nested array (as a string)
      const firstNestedElement = arrValue.elements[0]
      expect(firstNestedElement.type).toBe('Element')
      if (firstNestedElement.type === 'Element') {
        expect(firstNestedElement.value.type).toBe('String')
        if (firstNestedElement.value.type === 'String') {
          expect(firstNestedElement.value.value).toBe('[nested1, nested2]')
        }
      }

      // Second nested array (as a string)
      const secondNestedElement = arrValue.elements[1]
      expect(secondNestedElement.type).toBe('Element')
      if (secondNestedElement.type === 'Element') {
        expect(secondNestedElement.value.type).toBe('String')
        if (secondNestedElement.value.type === 'String') {
          expect(secondNestedElement.value.value).toBe('[nested3, nested4]')
        }
      }
    }
  })

  it('should parse unquoted strings in objects within arrays', () => {
    const input = `items: ["{ name: user1, id: 1 }", "{ name: user2, id: 2 }"]`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const items = assertBlockNode(result[0], 'items')
    const valueNode = findValueNode(items)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const arrValue = assertArrayValue(valueNode)

      // Check that the array has the expected elements
      expect(arrValue.elements.length).toBe(2)

      // First object (as a string)
      const firstElement = arrValue.elements[0]
      expect(firstElement.type).toBe('Element')
      if (firstElement.type === 'Element') {
        expect(firstElement.value.type).toBe('String')
        if (firstElement.value.type === 'String') {
          expect(firstElement.value.value).toBe('{ name: user1, id: 1 }')
        }
      }

      // Second object (as a string)
      const secondElement = arrValue.elements[1]
      expect(secondElement.type).toBe('Element')
      if (secondElement.type === 'Element') {
        expect(secondElement.value.type).toBe('String')
        if (secondElement.value.type === 'String') {
          expect(secondElement.value.value).toBe('{ name: user2, id: 2 }')
        }
      }
    }
  })
  it('should parse arrays with unquoted strings as equivalent to quoted strings', () => {
    const input = `
arrays
  quoted: ["value1", "value2", "value3"]
  unquoted: [value1, value2, value3]
  mixed: [value1, "value2", 3, true]
`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const arrays = assertBlockNode(result[0], 'arrays')

    // Get the quoted and unquoted arrays
    const quoted = findChildBlockByName(arrays, 'quoted')
    const unquoted = findChildBlockByName(arrays, 'unquoted')
    const mixed = findChildBlockByName(arrays, 'mixed')

    expect(quoted).toBeDefined()
    expect(unquoted).toBeDefined()
    expect(mixed).toBeDefined()

    if (quoted && unquoted && mixed) {
      // Check quoted array
      const quotedValueNode = findValueNode(quoted)
      expect(quotedValueNode).toBeDefined()
      if (quotedValueNode) {
        const quotedArray = assertArrayValue(quotedValueNode)
        assertArrayHasElement(quotedArray, 0, 'String', 'value1')
        assertArrayHasElement(quotedArray, 1, 'String', 'value2')
        assertArrayHasElement(quotedArray, 2, 'String', 'value3')
      }

      // Check unquoted array
      const unquotedValueNode = findValueNode(unquoted)
      expect(unquotedValueNode).toBeDefined()
      if (unquotedValueNode) {
        const unquotedArray = assertArrayValue(unquotedValueNode)
        assertArrayHasElement(unquotedArray, 0, 'String', 'value1')
        assertArrayHasElement(unquotedArray, 1, 'String', 'value2')
        assertArrayHasElement(unquotedArray, 2, 'String', 'value3')
      }

      // Check mixed array
      const mixedValueNode = findValueNode(mixed)
      expect(mixedValueNode).toBeDefined()
      if (mixedValueNode) {
        const mixedArray = assertArrayValue(mixedValueNode)
        assertArrayHasElement(mixedArray, 0, 'String', 'value1')
        assertArrayHasElement(mixedArray, 1, 'String', 'value2')
        assertArrayHasElement(mixedArray, 2, 'Number', 3)
        assertArrayHasElement(mixedArray, 3, 'Boolean', true)
      }
    }
  })
})
