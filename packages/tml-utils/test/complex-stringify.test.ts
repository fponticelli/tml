import { describe, it, expect } from 'vitest'
import { parseTML } from '@typedml/parser'
import { stringifyTML } from '../src'

describe('Complex TML Stringification', () => {
  it('should correctly stringify a complex TML document', () => {
    const input = `$schema: "https://example.com/schema/tml-html/1.0"
html lang=en
  head
    title: My Website
    meta charset=UTF-8
    meta name=viewport content='width=device-width' initial-scale=1.0
  body
    h1: Welcome to TML
    p: A concise and typed markup language.
    img src=logo.png alt='Site Logo'
    // Boolean shortcut
    button disabled!
    // Structured values
    config={
      server: "api.example.com",
      retries: 3,
      features: [
        "fast-start",
        "auto-retry"
      ]
    }
    // Arrays with unquoted strings
    tags: [item1, item2, item3]
    // Special blocks
    $ref path="./components/button.tml" id=myButton
    // Multiline value
    description:
      This is a multiline string
      that spans several lines
      and is parsed as one value
    /* This is a block comment
       that spans multiple lines */`

    const nodes = parseTML(input)
    const output = stringifyTML(nodes)

    // Check that the output contains all the key elements
    expect(output).toContain(
      '$schema: "https://example.com/schema/tml-html/1.0"'
    )
    expect(output).toContain('html lang=en')
    expect(output).toContain('head')
    expect(output).toContain('title: "My Website"')
    expect(output).toContain('meta charset="UTF-8"')
    expect(output).toContain('content="width=device-width"')
    expect(output).toContain('body')
    expect(output).toContain('h1: "Welcome to TML"')
    expect(output).toContain('p: "A concise and typed markup language."')
    expect(output).toContain('img src=logo.png alt="Site Logo"')
    expect(output).toContain('// Boolean shortcut')
    expect(output).toContain('button disabled!')
    expect(output).toContain('// Structured values')

    // Parse the output again to make sure it's valid TML
    const reparsed = parseTML(output)
    expect(reparsed.length).toBeGreaterThan(0)

    // Create a simpler test for object structure
    const objectInput = `block config={
  server: "api.example.com",
  retries: 3,
  features: [
    "fast-start",
    "auto-retry"
  ]
}`

    const objectNodes = parseTML(objectInput)
    const objectOutput = stringifyTML(objectNodes)

    // Verify object structure is correctly stringified
    expect(objectOutput).toContain('block')
    expect(objectOutput).toContain('config={')
    expect(objectOutput).toContain('server: "api.example.com"')
    expect(objectOutput).toContain('retries: 3')
    expect(objectOutput).toContain('features: [')
    expect(objectOutput).toContain('"fast-start"')
    expect(objectOutput).toContain('"auto-retry"')
    expect(objectOutput).toContain(']')

    // Create a simpler test for array structure
    const arrayInput = `block tags: [item1, item2, item3]`

    const arrayNodes = parseTML(arrayInput)
    const arrayOutput = stringifyTML(arrayNodes)

    // Verify array structure is correctly stringified
    expect(arrayOutput).toContain('block')
    expect(arrayOutput).toContain('tags:')
    expect(arrayOutput).toContain('item1')
    expect(arrayOutput).toContain('item2')
    expect(arrayOutput).toContain('item3')

    // Create a simpler test for block comment
    const commentInput = `block
  // Line comment
  /* Block comment
     that spans multiple lines */`

    const commentNodes = parseTML(commentInput)
    const commentOutput = stringifyTML(commentNodes)

    // Verify comment structure is correctly stringified
    expect(commentOutput).toContain('block')
    expect(commentOutput).toContain('// Line comment')
    expect(commentOutput).toContain('/* Block comment')
    expect(commentOutput).toContain('that spans multiple lines */')
  })
})
