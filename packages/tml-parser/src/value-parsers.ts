import {
  ArrayElement,
  BooleanValue,
  CommentNode,
  NumberValue,
  ObjectField,
  Position,
  PositionedArrayValue,
  PositionedObjectValue,
  StringValue,
  Value,
} from '@/types'

/**
 * Parses a string value, handling quotes and escapes.
 */
export function parseStringValue(
  value: string,
  position?: Position
): StringValue {
  let parsed = value.trim()

  // Handle quoted strings
  if (
    (parsed.startsWith('"') && parsed.endsWith('"')) ||
    (parsed.startsWith("'") && parsed.endsWith("'"))
  ) {
    // Remove quotes and handle escapes
    const quote = parsed[0]
    parsed = parsed
      .slice(1, -1)
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\r/g, '\r')
      .replace(new RegExp(`\\\\${quote}`, 'g'), quote)
      .replace(/\\\\/g, '\\')
  }

  return {
    type: 'String',
    value: parsed,
    position,
  }
}

/**
 * Parses a number value.
 */
export function parseNumberValue(
  value: string,
  position?: Position
): NumberValue {
  return {
    type: 'Number',
    value: Number(value.trim()),
    position,
  }
}

/**
 * Parses a boolean value.
 */
export function parseBooleanValue(
  value: string,
  position?: Position
): BooleanValue {
  return {
    type: 'Boolean',
    value: value.trim().toLowerCase() === 'true',
    position,
  }
}

/**
 * Determines the type of a value and parses it accordingly.
 */
export function parseValue(value: string, position?: Position): Value {
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
export function parseObjectValue(
  value: string,
  position?: Position
): PositionedObjectValue {
  const fields: Array<ObjectField | CommentNode> = []
  let content = value.trim().slice(1, -1).trim()

  // Handle multiline objects by normalizing whitespace
  if (content.includes('\n')) {
    // Remove common indentation
    const lines = content.split(/\r?\n/)
    const indentations = lines
      .filter(line => line.trim().length > 0)
      .map(line => line.match(/^(\s*)/)?.[1].length || 0)

    if (indentations.length > 0) {
      const minIndent = Math.min(...indentations)
      content = lines
        .map(line => {
          if (line.trim().length === 0) return ''
          return line.substring(Math.min(minIndent, line.length))
        })
        .join(' ')
        .trim()
    } else {
      content = lines.join(' ').trim()
    }
  }

  // More robust parsing for nested structures
  if (content) {
    let currentKey = ''
    let currentValue = ''
    let inQuote: string | null = null
    let inObject = 0
    let inArray = 0
    let collectingKey = true
    let inLineComment = false
    let inBlockComment = false
    let commentBuffer = ''

    for (let i = 0; i <= content.length; i++) {
      const char = i < content.length ? content[i] : ',' // Add a comma at the end to process the last field
      const prevChar = i > 0 ? content[i - 1] : ''
      const nextChar = i < content.length - 1 ? content[i + 1] : ''

      // Handle comments
      if (!inQuote && !inBlockComment && char === '/' && nextChar === '/') {
        inLineComment = true
        commentBuffer = '//'
        i++ // Skip the next slash
        continue
      }

      if (!inQuote && !inLineComment && char === '/' && nextChar === '*') {
        inBlockComment = true
        commentBuffer = '/*'
        i++ // Skip the next asterisk
        continue
      }

      // End of line comment
      if (inLineComment && (char === '\n' || i === content.length)) {
        fields.push({
          type: 'Comment',
          value: commentBuffer.slice(2).trim(),
          isLineComment: true,
          position,
        })
        inLineComment = false
        commentBuffer = ''

        // If we're at the end of the content, don't process the comma
        if (i === content.length) continue
      }

      // End of block comment
      if (inBlockComment && char === '*' && nextChar === '/') {
        fields.push({
          type: 'Comment',
          value: commentBuffer.slice(2).trim(),
          isLineComment: false,
          position,
        })
        inBlockComment = false
        commentBuffer = ''
        i++ // Skip the next slash
        continue
      }

      // Collect comment content
      if (inLineComment || inBlockComment) {
        commentBuffer += char
        continue
      }

      // Handle quotes
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (inQuote === char) {
          inQuote = null
        } else if (inQuote === null) {
          inQuote = char
        }
      }

      // Handle nested objects
      if (char === '{' && inQuote === null) {
        inObject++
      } else if (char === '}' && inQuote === null) {
        inObject--
      }

      // Handle nested arrays
      if (char === '[' && inQuote === null) {
        inArray++
      } else if (char === ']' && inQuote === null) {
        inArray--
      }

      // Handle field separator
      if (
        char === ':' &&
        inQuote === null &&
        inObject === 0 &&
        inArray === 0 &&
        collectingKey
      ) {
        currentKey = currentKey.trim()
        collectingKey = false
        continue
      }

      // Handle value separator
      if (char === ',' && inQuote === null && inObject === 0 && inArray === 0) {
        if (currentKey) {
          currentValue = currentValue.trim()
          fields.push({
            type: 'Field',
            key: currentKey,
            value: parseValue(currentValue, position),
            position,
          })
        }
        currentKey = ''
        currentValue = ''
        collectingKey = true
        continue
      }

      // Collect characters
      if (collectingKey) {
        currentKey += char
      } else {
        currentValue += char
      }
    }
  }

  return {
    type: 'Object',
    fields,
    position,
  }
}

/**
 * Parses an array value.
 */
export function parseArrayValue(
  value: string,
  position?: Position
): PositionedArrayValue {
  const elements: Array<ArrayElement | CommentNode> = []
  let content = value.trim().slice(1, -1).trim()

  // Handle multiline arrays by normalizing whitespace
  if (content.includes('\n')) {
    // Remove common indentation
    const lines = content.split(/\r?\n/)
    const indentations = lines
      .filter(line => line.trim().length > 0)
      .map(line => line.match(/^(\s*)/)?.[1].length || 0)

    if (indentations.length > 0) {
      const minIndent = Math.min(...indentations)
      content = lines
        .map(line => {
          if (line.trim().length === 0) return ''
          return line.substring(Math.min(minIndent, line.length))
        })
        .join(' ')
        .trim()
    } else {
      content = lines.join(' ').trim()
    }
  }

  // More robust parsing for nested structures
  if (content) {
    let currentValue = ''
    let inQuote: string | null = null
    let inObject = 0
    let inArray = 0
    let inLineComment = false
    let inBlockComment = false
    let commentBuffer = ''

    for (let i = 0; i <= content.length; i++) {
      const char = i < content.length ? content[i] : ',' // Add a comma at the end to process the last element
      const prevChar = i > 0 ? content[i - 1] : ''
      const nextChar = i < content.length - 1 ? content[i + 1] : ''

      // Handle comments
      if (!inQuote && !inBlockComment && char === '/' && nextChar === '/') {
        inLineComment = true
        commentBuffer = '//'
        i++ // Skip the next slash
        continue
      }

      if (!inQuote && !inLineComment && char === '/' && nextChar === '*') {
        inBlockComment = true
        commentBuffer = '/*'
        i++ // Skip the next asterisk
        continue
      }

      // End of line comment
      if (inLineComment && (char === '\n' || i === content.length)) {
        elements.push({
          type: 'Comment',
          value: commentBuffer.slice(2).trim(),
          isLineComment: true,
          position,
        })
        inLineComment = false
        commentBuffer = ''

        // If we're at the end of the content, don't process the comma
        if (i === content.length) continue
      }

      // End of block comment
      if (inBlockComment && char === '*' && nextChar === '/') {
        elements.push({
          type: 'Comment',
          value: commentBuffer.slice(2).trim(),
          isLineComment: false,
          position,
        })
        inBlockComment = false
        commentBuffer = ''
        i++ // Skip the next slash
        continue
      }

      // Collect comment content
      if (inLineComment || inBlockComment) {
        commentBuffer += char
        continue
      }

      // Handle quotes
      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (inQuote === char) {
          inQuote = null
        } else if (inQuote === null) {
          inQuote = char
        }
      }

      // Handle nested objects
      if (char === '{' && inQuote === null) {
        inObject++
      } else if (char === '}' && inQuote === null) {
        inObject--
      }

      // Handle nested arrays
      if (char === '[' && inQuote === null) {
        inArray++
      } else if (char === ']' && inQuote === null) {
        inArray--
      }

      // Handle element separator
      if (char === ',' && inQuote === null && inObject === 0 && inArray === 0) {
        if (currentValue.trim()) {
          elements.push({
            type: 'Element',
            value: parseValue(currentValue.trim(), position),
            position,
          })
        }
        currentValue = ''
        continue
      }

      // Collect characters
      currentValue += char
    }
  }

  return {
    type: 'Array',
    elements,
    position,
  }
}
