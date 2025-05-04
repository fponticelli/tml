import { describe, it, expect } from 'vitest'
import { parseTML } from '../src'
import {
  assertBlockNode,
  findValueNode,
  assertObjectValue,
  assertObjectHasField,
  findChildBlockByName,
} from './helpers'

describe('Unquoted Strings in Objects', () => {
  it('should parse unquoted strings in objects', () => {
    const input = `config: { name: MyApp, version: 1.0 }`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const config = assertBlockNode(result[0], 'config')
    const valueNode = findValueNode(config)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const objValue = assertObjectValue(valueNode)

      // Check that the object has the expected fields
      assertObjectHasField(objValue, 'name', 'String', 'MyApp')
      assertObjectHasField(objValue, 'version', 'Number', 1.0)
    }
  })

  it('should parse objects with mixed quoted and unquoted strings', () => {
    const input = `config: { name: "MyApp", description: A great application, version: 1.0 }`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const config = assertBlockNode(result[0], 'config')
    const valueNode = findValueNode(config)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const objValue = assertObjectValue(valueNode)

      // Check that the object has the expected fields
      assertObjectHasField(objValue, 'name', 'String', 'MyApp')
      assertObjectHasField(
        objValue,
        'description',
        'String',
        'A great application'
      )
      assertObjectHasField(objValue, 'version', 'Number', 1.0)
    }
  })

  it('should parse objects with unquoted strings containing special characters', () => {
    const input = `config: { kebab-case: value-with-dash, snake_case: value_with_underscore, dots: value.with.dots }`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const config = assertBlockNode(result[0], 'config')
    const valueNode = findValueNode(config)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const objValue = assertObjectValue(valueNode)

      // Check that the object has the expected fields
      assertObjectHasField(objValue, 'kebab-case', 'String', 'value-with-dash')
      assertObjectHasField(
        objValue,
        'snake_case',
        'String',
        'value_with_underscore'
      )
      assertObjectHasField(objValue, 'dots', 'String', 'value.with.dots')
    }
  })

  it('should parse nested objects with unquoted strings', () => {
    const input = `config: { app: { name: MyApp, version: 1.0 }, server: { host: localhost, port: 8080 } }`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const config = assertBlockNode(result[0], 'config')
    const valueNode = findValueNode(config)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const objValue = assertObjectValue(valueNode)

      // Check app field
      const appField = objValue.fields.find(
        field => field.type === 'Field' && field.key === 'app'
      )

      expect(appField).toBeDefined()
      if (appField && appField.type === 'Field') {
        expect(appField.value.type).toBe('Object')
        if (appField.value.type === 'Object') {
          const appObj = appField.value
          assertObjectHasField(appObj, 'name', 'String', 'MyApp')
          assertObjectHasField(appObj, 'version', 'Number', 1.0)
        }
      }

      // Check server field
      const serverField = objValue.fields.find(
        field => field.type === 'Field' && field.key === 'server'
      )

      expect(serverField).toBeDefined()
      if (serverField && serverField.type === 'Field') {
        expect(serverField.value.type).toBe('Object')
        if (serverField.value.type === 'Object') {
          const serverObj = serverField.value
          assertObjectHasField(serverObj, 'host', 'String', 'localhost')
          assertObjectHasField(serverObj, 'port', 'Number', 8080)
        }
      }
    }
  })

  it('should parse objects with arrays containing unquoted strings', () => {
    const input = `config: { name: MyApp, tags: [web, app, frontend] }`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const config = assertBlockNode(result[0], 'config')
    const valueNode = findValueNode(config)
    expect(valueNode).toBeDefined()

    if (valueNode) {
      const objValue = assertObjectValue(valueNode)

      // Check name field
      assertObjectHasField(objValue, 'name', 'String', 'MyApp')

      // Check tags field
      const tagsField = objValue.fields.find(
        field => field.type === 'Field' && field.key === 'tags'
      )

      expect(tagsField).toBeDefined()
      if (tagsField && tagsField.type === 'Field') {
        expect(tagsField.value.type).toBe('Array')
        if (tagsField.value.type === 'Array') {
          const tagsArray = tagsField.value
          expect(tagsArray.elements.length).toBe(3)

          // Check array elements
          const elements = tagsArray.elements.filter(
            el => el.type === 'Element'
          )
          expect(elements.length).toBe(3)

          expect(elements[0].value.type).toBe('String')
          expect(elements[1].value.type).toBe('String')
          expect(elements[2].value.type).toBe('String')

          if (
            elements[0].value.type === 'String' &&
            elements[1].value.type === 'String' &&
            elements[2].value.type === 'String'
          ) {
            expect(elements[0].value.value).toBe('web')
            expect(elements[1].value.value).toBe('app')
            expect(elements[2].value.value).toBe('frontend')
          }
        }
      }
    }
  })

  it('should parse objects with unquoted strings as equivalent to quoted strings', () => {
    const input = `
objects
  quoted: { name: "MyApp", version: "1.0" }
  unquoted: { name: MyApp, version: 1.0 }
  mixed: { name: MyApp, description: "A great application", version: 1.0 }
`

    const result = parseTML(input)
    expect(result.length).toBe(1)

    const objects = assertBlockNode(result[0], 'objects')

    // Get the quoted and unquoted objects
    const quoted = findChildBlockByName(objects, 'quoted')
    const unquoted = findChildBlockByName(objects, 'unquoted')
    const mixed = findChildBlockByName(objects, 'mixed')

    expect(quoted).toBeDefined()
    expect(unquoted).toBeDefined()
    expect(mixed).toBeDefined()

    if (quoted && unquoted && mixed) {
      // Check quoted object
      const quotedValueNode = findValueNode(quoted)
      expect(quotedValueNode).toBeDefined()
      if (quotedValueNode) {
        const quotedObj = assertObjectValue(quotedValueNode)
        assertObjectHasField(quotedObj, 'name', 'String', 'MyApp')
        assertObjectHasField(quotedObj, 'version', 'String', '1.0')
      }

      // Check unquoted object
      const unquotedValueNode = findValueNode(unquoted)
      expect(unquotedValueNode).toBeDefined()
      if (unquotedValueNode) {
        const unquotedObj = assertObjectValue(unquotedValueNode)
        assertObjectHasField(unquotedObj, 'name', 'String', 'MyApp')
        assertObjectHasField(unquotedObj, 'version', 'Number', 1.0)
      }

      // Check mixed object
      const mixedValueNode = findValueNode(mixed)
      expect(mixedValueNode).toBeDefined()
      if (mixedValueNode) {
        const mixedObj = assertObjectValue(mixedValueNode)
        assertObjectHasField(mixedObj, 'name', 'String', 'MyApp')
        assertObjectHasField(
          mixedObj,
          'description',
          'String',
          'A great application'
        )
        assertObjectHasField(mixedObj, 'version', 'Number', 1.0)
      }
    }
  })
})
