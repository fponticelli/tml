import {
  Attribute,
  ArrayElement,
  BlockNode,
  BooleanValue,
  CommentNode,
  Node,
  NumberValue,
  ObjectField,
  Point,
  Position,
  PositionedArrayValue,
  PositionedObjectValue,
  StringValue,
  Value,
  ValueNode
} from '@/types'

/**
 * Creates a Point object representing a position in the source.
 */
function createPoint(line: number, column: number): Point {
  return { line, column }
}

/**
 * Creates a Position object representing a span in the source.
 */
function createPosition(startLine: number, startColumn: number, endLine: number, endColumn: number): Position {
  return {
    start: createPoint(startLine, startColumn),
    end: createPoint(endLine, endColumn)
  }
}

/**
 * Creates a Position object for a single line span.
 */
function createLinePosition(line: number, startColumn: number, endColumn: number): Position {
  return createPosition(line, startColumn, line, endColumn)
}

/**
 * Parses a string value, handling quotes and escapes.
 */
function parseStringValue(value: string, position?: Position): StringValue {
  let parsed = value.trim()

  // Handle quoted strings
  if ((parsed.startsWith('"') && parsed.endsWith('"')) ||
      (parsed.startsWith("'") && parsed.endsWith("'"))) {
    // Remove quotes and handle escapes
    const quote = parsed[0]
    parsed = parsed.slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(new RegExp(`\\\\${quote}`, 'g'), quote)
      .replace(/\\\\/g, '\\')
  }

  return {
    type: 'String',
    value: parsed,
    position
  }
}

/**
 * Parses a number value.
 */
function parseNumberValue(value: string, position?: Position): NumberValue {
  return {
    type: 'Number',
    value: Number(value.trim()),
    position
  }
}

/**
 * Parses a boolean value.
 */
function parseBooleanValue(value: string, position?: Position): BooleanValue {
  return {
    type: 'Boolean',
    value: value.trim().toLowerCase() === 'true',
    position
  }
}

/**
 * Determines the type of a value and parses it accordingly.
 */
function parseValue(value: string, position?: Position): Value {
  const trimmed = value.trim()

  // Check for object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseObjectValue(trimmed, position)
  }

  // Check for array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return parseArrayValue(trimmed, position)
  }

  // Check for boolean
  if (trimmed === 'true' || trimmed === 'false') {
    return parseBooleanValue(trimmed, position)
  }

  // Check for number
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return parseNumberValue(trimmed, position)
  }

  // Default to string
  return parseStringValue(trimmed, position)
}

/**
 * Parses an object value.
 */
function parseObjectValue(value: string, position?: Position): PositionedObjectValue {
  const fields: Array<ObjectField | CommentNode> = []
  const content = value.trim().slice(1, -1).trim()

  // Simple implementation - in a real parser, you'd need a more robust approach
  // to handle nested objects, arrays, and proper tokenization
  if (content) {
    const pairs = content.split(',')

    for (const pair of pairs) {
      const colonIndex = pair.indexOf(':')
      if (colonIndex > 0) {
        const key = pair.slice(0, colonIndex).trim()
        const fieldValue = pair.slice(colonIndex + 1).trim()

        fields.push({
          type: 'Field',
          key,
          value: parseValue(fieldValue),
          position
        })
      }
    }
  }

  return {
    type: 'Object',
    fields,
    position
  }
}

/**
 * Parses an array value.
 */
function parseArrayValue(value: string, position?: Position): PositionedArrayValue {
  const elements: Array<ArrayElement | CommentNode> = []
  const content = value.trim().slice(1, -1).trim()

  // Simple implementation - in a real parser, you'd need a more robust approach
  // to handle nested arrays, objects, and proper tokenization
  if (content) {
    const items = content.split(',')

    for (const item of items) {
      elements.push({
        type: 'Element',
        value: parseValue(item.trim()),
        position
      })
    }
  }

  return {
    type: 'Array',
    elements,
    position
  }
}

/**
 * Parses an attribute (key=value).
 */
function parseAttribute(text: string, line: number, startColumn: number): Attribute {
  const equalsIndex = text.indexOf('=')

  // Handle boolean shortcut (key!)
  if (equalsIndex === -1 && text.endsWith('!')) {
    const key = text.slice(0, -1)
    const position = createLinePosition(line, startColumn, startColumn + text.length)

    return {
      type: 'Attribute',
      key,
      value: {
        type: 'Boolean',
        value: true,
        position
      },
      position
    }
  }

  // Regular key=value attribute
  if (equalsIndex > 0) {
    const key = text.slice(0, equalsIndex).trim()
    const valueText = text.slice(equalsIndex + 1).trim()
    const position = createLinePosition(line, startColumn, startColumn + text.length)

    return {
      type: 'Attribute',
      key,
      value: parseValue(valueText, position),
      position
    }
  }

  // Fallback - treat as boolean true
  return {
    type: 'Attribute',
    key: text,
    value: {
      type: 'Boolean',
      value: true,
      position: createLinePosition(line, startColumn, startColumn + text.length)
    },
    position: createLinePosition(line, startColumn, startColumn + text.length)
  }
}

/**
 * Parses a line comment.
 */
function parseLineComment(text: string, line: number, startColumn: number): CommentNode {
  const commentText = text.startsWith('//') ? text.slice(2).trim() : text

  return {
    type: 'Comment',
    value: commentText,
    isLineComment: true,
    position: createLinePosition(line, startColumn, startColumn + text.length)
  }
}

/**
 * Parses a block comment.
 */
function parseBlockComment(text: string, line: number, startColumn: number): CommentNode {
  // Remove /* and */ from the comment
  const commentText = text.slice(2, -2).trim()

  return {
    type: 'Comment',
    value: commentText,
    isLineComment: false,
    position: createLinePosition(line, startColumn, startColumn + text.length)
  }
}

/**
 * Parses a value node (prefixed with ":").
 */
function parseValueNode(text: string, line: number, startColumn: number): ValueNode {
  const valueText = text.startsWith(':') ? text.slice(1).trim() : text
  const position = createLinePosition(line, startColumn, startColumn + text.length)

  return {
    type: 'Value',
    value: parseValue(valueText, position),
    position
  }
}

/**
 * Tokenizes a line of TML into its components.
 */
function tokenizeLine(line: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inQuote: string | null = null
  let inObject = 0
  let inArray = 0

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1] || ''

    // Handle quotes
    if ((char === '"' || char === "'") && line[i - 1] !== '\\') {
      if (inQuote === char) {
        inQuote = null
        current += char
      } else if (inQuote === null) {
        inQuote = char
        current += char
      } else {
        current += char
      }
      continue
    }

    // Handle objects
    if (char === '{') {
      inObject++
      current += char
      continue
    }

    if (char === '}') {
      inObject--
      current += char
      continue
    }

    // Handle arrays
    if (char === '[') {
      inArray++
      current += char
      continue
    }

    if (char === ']') {
      inArray--
      current += char
      continue
    }

    // Handle whitespace as token separator (when not in quotes, objects, or arrays)
    if (char === ' ' && inQuote === null && inObject === 0 && inArray === 0) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    // Handle comments
    if (char === '/' && nextChar === '/' && inQuote === null) {
      if (current) {
        tokens.push(current)
      }
      tokens.push(line.slice(i))
      break
    }

    if (char === '/' && nextChar === '*' && inQuote === null) {
      // Find the end of the block comment
      const endIndex = line.indexOf('*/', i + 2)
      if (endIndex !== -1) {
        if (current) {
          tokens.push(current)
        }
        tokens.push(line.slice(i, endIndex + 2))
        i = endIndex + 1
        current = ''
      } else {
        // Comment doesn't end on this line
        current += char
      }
      continue
    }

    // Add character to current token
    current += char
  }

  // Add the last token if there is one
  if (current) {
    tokens.push(current)
  }

  return tokens
}

/**
 * Parses a line of TML into a node.
 */
function parseLine(line: string, lineNumber: number): { indent: number; node: Node | null } {
  // Skip empty lines
  if (!line.trim()) {
    return { indent: 0, node: null }
  }

  // Calculate indentation
  const indent = line.search(/\S/)
  if (indent === -1) {
    return { indent: 0, node: null }
  }

  const trimmedLine = line.trim()

  // Handle line comments
  if (trimmedLine.startsWith('//')) {
    return {
      indent,
      node: parseLineComment(trimmedLine, lineNumber, indent)
    }
  }

  // Handle block comments
  if (trimmedLine.startsWith('/*') && trimmedLine.endsWith('*/')) {
    return {
      indent,
      node: parseBlockComment(trimmedLine, lineNumber, indent)
    }
  }

  // Handle value nodes
  if (trimmedLine.startsWith(':')) {
    return {
      indent,
      node: parseValueNode(trimmedLine, lineNumber, indent)
    }
  }

  // Handle block nodes with values (e.g., "title: My Page")
  const colonIndex = trimmedLine.indexOf(':')
  if (colonIndex > 0 && !trimmedLine.substring(0, colonIndex).includes(' ')) {
    const blockName = trimmedLine.substring(0, colonIndex)
    const valueText = trimmedLine.substring(colonIndex)
    const valueNode = parseValueNode(valueText, lineNumber, indent + colonIndex)

    return {
      indent,
      node: {
        type: 'Block',
        name: blockName,
        children: [valueNode],
        position: createLinePosition(lineNumber, indent, indent + trimmedLine.length)
      }
    }
  }

  // Handle block nodes
  const tokens = tokenizeLine(trimmedLine)
  if (tokens.length === 0) {
    return { indent: 0, node: null }
  }

  const blockName = tokens[0]
  const children: Node[] = []
  let currentColumn = indent + blockName.length + 1

  // Process remaining tokens
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i]

    // Skip empty tokens
    if (!token.trim()) {
      currentColumn += token.length + 1
      continue
    }

    // Handle comments
    if (token.startsWith('//')) {
      children.push(parseLineComment(token, lineNumber, currentColumn))
      break
    }

    if (token.startsWith('/*') && token.endsWith('*/')) {
      children.push(parseBlockComment(token, lineNumber, currentColumn))
      currentColumn += token.length + 1
      continue
    }

    // Handle attributes (key=value or key!)
    if (token.includes('=') || token.endsWith('!')) {
      children.push(parseAttribute(token, lineNumber, currentColumn))
      currentColumn += token.length + 1
      continue
    }

    // Handle value nodes (inline with :)
    if (token.startsWith(':')) {
      // Collect the rest of the tokens as the value
      const valueText = tokens.slice(i).join(' ')
      children.push(parseValueNode(valueText, lineNumber, currentColumn))
      break
    }

    // Handle inline blocks
    children.push({
      type: 'Block',
      name: token,
      children: [],
      position: createLinePosition(lineNumber, currentColumn, currentColumn + token.length)
    })

    currentColumn += token.length + 1
  }

  // Create the block node
  return {
    indent,
    node: {
      type: 'Block',
      name: blockName,
      children,
      position: createLinePosition(lineNumber, indent, indent + trimmedLine.length)
    }
  }
}

/**
 * Main parser function that converts a TML string into an AST.
 */
export function parseTML(input: string): Node[] {
  const lines = input.split(/\r?\n/)
  const root: Node[] = []
  const stack: { indent: number; node: BlockNode }[] = []

  // Process each line
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1
    const { indent, node } = parseLine(lines[i], lineNumber)

    // Skip null nodes (empty lines)
    if (!node) {
      continue
    }

    // Handle indentation to build the hierarchy
    while (stack.length > 0 && indent <= stack[stack.length - 1].indent) {
      stack.pop()
    }

    if (stack.length === 0) {
      // Add to root if there's no parent
      root.push(node)
    } else {
      // Add to parent's children
      stack[stack.length - 1].node.children.push(node)
    }

    // Push block nodes to the stack for potential children
    if (node.type === 'Block') {
      stack.push({ indent, node })
    }
  }

  return root
}

/**
 * Parses a multiline TML string into a single value.
 */
export function parseTMLValue(input: string): Value {
  const lines = input.split(/\r?\n/)
  const trimmedLines = lines.map(line => line.trim())
  const joined = trimmedLines.join(' ')

  return parseValue(joined)
}
