import {
  ArrayElement,
  BooleanValue,
  CommentNode,
  NumberValue,
  ObjectField,
  Position,
  ArrayValue,
  ObjectValue,
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
    type: 'string',
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
    type: 'number',
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
    type: 'boolean',
    value: value.trim().toLowerCase() === 'true',
    position,
  }
}

/**
 * Determines if a value should be treated as a string when in a structured context
 * like an array or object. This is used to identify unquoted strings.
 */
export function isUnquotedString(value: string): boolean {
  const trimmed = value.trim()

  // If it's already quoted, it's not an unquoted string
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return false
  }

  // If it's a boolean, it's not an unquoted string
  if (trimmed === 'true' || trimmed === 'false') {
    return false
  }

  // If it's a number, it's not an unquoted string
  if (!isNaN(Number(trimmed)) && trimmed !== '') {
    return false
  }

  // If it's an object or array, it's not an unquoted string
  if (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  ) {
    return false
  }

  // Otherwise, it's an unquoted string
  return true
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
): ObjectValue {
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

  // Helper function to process a value for object fields
  const processFieldValue = (key: string, value: string) => {
    if (!key) return

    const trimmedValue = value.trim()

    // Check if it's a nested array or object
    if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
      // It's a nested array
      fields.push({
        type: 'Field',
        key,
        value: parseArrayValue(trimmedValue, position),
        position,
      })
    } else if (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) {
      // It's a nested object
      fields.push({
        type: 'Field',
        key,
        value: parseObjectValue(trimmedValue, position),
        position,
      })
    } else {
      // It's a regular value
      fields.push({
        type: 'Field',
        key,
        value: parseValue(trimmedValue, position),
        position,
      })
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

      // Handle value separator (comma or whitespace followed by a new key)
      if (
        (char === ',' && inQuote === null && inObject === 0 && inArray === 0) ||
        (char === ' ' &&
          inQuote === null &&
          inObject === 0 &&
          inArray === 0 &&
          !collectingKey &&
          i < content.length - 1 &&
          // Look ahead to see if this is followed by what looks like a new key
          (() => {
            // Find the next non-whitespace character
            let j = i + 1
            while (j < content.length && /\s/.test(content[j])) j++

            // Check if there's a colon after some text (potential key)
            if (j < content.length) {
              let potentialKey = ''
              let k = j
              while (
                k < content.length &&
                content[k] !== ':' &&
                content[k] !== ',' &&
                content[k] !== '{' &&
                content[k] !== '}' &&
                content[k] !== '[' &&
                content[k] !== ']' &&
                !/\s/.test(content[k])
              ) {
                potentialKey += content[k]
                k++
              }

              // Skip whitespace after the potential key
              while (k < content.length && /\s/.test(content[k])) k++

              // If we found a non-empty key followed by a colon, this is a new field
              return (
                potentialKey.trim().length > 0 &&
                k < content.length &&
                content[k] === ':'
              )
            }
            return false
          })())
      ) {
        if (currentKey) {
          processFieldValue(currentKey.trim(), currentValue.trim())
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

    // Process the last field if there's any remaining key/value
    // This handles the case where the object doesn't end with a comma
    if (currentKey && !collectingKey) {
      processFieldValue(currentKey.trim(), currentValue.trim())
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
): ArrayValue {
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

  // Helper function to process a value and add it to elements
  const processValue = (value: string) => {
    if (!value.trim()) return

    const trimmedValue = value.trim()

    // Check if it's a nested array or object
    if (trimmedValue.startsWith('[') && trimmedValue.endsWith(']')) {
      // It's a nested array
      elements.push({
        type: 'Element',
        value: parseArrayValue(trimmedValue, position),
        position,
      })
    } else if (trimmedValue.startsWith('{') && trimmedValue.endsWith('}')) {
      // It's a nested object
      elements.push({
        type: 'Element',
        value: parseObjectValue(trimmedValue, position),
        position,
      })
    } else {
      // It's a regular value
      elements.push({
        type: 'Element',
        value: parseValue(trimmedValue, position),
        position,
      })
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

      // Handle element separator (comma or whitespace followed by a new value)
      if (
        (char === ',' && inQuote === null && inObject === 0 && inArray === 0) ||
        (char === ' ' &&
          inQuote === null &&
          inObject === 0 &&
          inArray === 0 &&
          currentValue.trim().length > 0 &&
          i < content.length - 1 &&
          // Look ahead to see if this is followed by what looks like a new value
          (() => {
            // Find the next non-whitespace character
            let j = i + 1
            while (j < content.length && /\s/.test(content[j])) j++

            // If we found a non-whitespace character that's not a comma, this is a new element
            return j < content.length && content[j] !== ','
          })())
      ) {
        processValue(currentValue.trim())
        currentValue = ''
        continue
      }

      // Collect characters
      currentValue += char
    }

    // Process the last element if there's any remaining value
    // This handles the case where the array doesn't end with a comma
    if (currentValue.trim()) {
      processValue(currentValue.trim())
    }
  }

  return {
    type: 'Array',
    elements,
    position,
  }
}
