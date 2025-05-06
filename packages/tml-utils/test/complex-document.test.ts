import { describe, it, expect } from 'vitest'
import { parseTML } from '@typedml/parser'
import { stringifyTML } from '../src'

describe('Complex Document Stringification', () => {
  it('should correctly stringify a complex document with nested structures', () => {
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

    // Parse the output again to make sure it's valid TML
    const reparsed = parseTML(output)

    expect(reparsed.length).toBeGreaterThan(0)

    // Check that the output contains the key elements
    expect(output).toContain(
      '$schema: "https://example.com/schema/tml-html/1.0"'
    )
    expect(output).toContain('html lang=en')
    expect(output).toContain('head')
    expect(output).toContain('title: "My Website"')
    expect(output).toContain('body')
    expect(output).toContain('h1: "Welcome to TML"')
    expect(output).toContain('p: "A concise and typed markup language."')
    expect(output).toContain('img src=logo.png alt="Site Logo"')
    expect(output).toContain('button disabled!')
    expect(output).toContain('config=')
    expect(output).toContain('tags:')
    expect(output).toContain('$ref path="./components/button.tml" id=myButton')
    expect(output).toContain('description:')
    expect(output).toContain('/* This is a block comment')

    // Check that the block comment is properly indented
    expect(output).toContain('  /* This is a block comment')

    // Check that the config object is present in some form
    expect(output).toContain('config')

    // Check that the tags array is properly indented
    expect(output).toContain('tags:')
  })
})
