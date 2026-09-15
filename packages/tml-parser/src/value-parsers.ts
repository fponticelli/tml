import {
  ArrayElement,
  BooleanValue,
  CommentNode,
  NumberValue,
  ObjectField,
  Point,
  Position,
  ArrayValue,
  ObjectValue,
  StringValue,
  Value,
} from './types'

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
 * Where character zero of a value's text sits in the document. Object and
 * array parsers need it to give each field or element a position of its own
 * instead of reusing the position of the value that contains them.
 */
export type ValueOrigin = Point

/**
 * Maps an offset inside `text` to a document point, given where the text starts.
 */
export function offsetToPoint(
  text: string,
  offset: number,
  origin: ValueOrigin
): Point {
  let { line, column } = origin

  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++
      column = 0
    } else {
      column++
    }
  }

  return { line, column }
}

/**
 * Builds the position of the slice `text[start, end)`.
 */
function spanPosition(
  text: string,
  start: number,
  end: number,
  origin: ValueOrigin | undefined,
  fallback: Position | undefined
): Position | undefined {
  if (!origin) return fallback

  return {
    start: offsetToPoint(text, start, origin),
    end: offsetToPoint(text, end, origin),
  }
}

/**
 * Determines the type of a value and parses it accordingly.
 */
export function parseValue(
  value: string,
  position?: Position,
  origin?: ValueOrigin
): Value {
  const trimmed = value.trim()
  const trimmedOrigin = origin
    ? offsetToPoint(value, value.length - value.trimStart().length, origin)
    : undefined

  // Check for object
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseObjectValue(trimmed, position, trimmedOrigin)
  }

  // Check for array
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return parseArrayValue(trimmed, position, trimmedOrigin)
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
  position?: Position,
  origin?: ValueOrigin
): ObjectValue {
  const fields: Array<ObjectField | CommentNode> = []
  const content = value.trim().slice(1, -1)
  // Character zero of `content` is the one right after the opening brace
  const contentOrigin = origin ? offsetToPoint(value, 1, origin) : undefined

  // Helper function to process a value for object fields
  const processFieldValue = (
    key: string,
    value: string,
    start: number,
    end: number,
    valueStart: number
  ) => {
    if (!key) return

    const trimmedValue = value.trim()
    const fieldPosition = spanPosition(
      content,
      start,
      end,
      contentOrigin,
      position
    )
    const valueOrigin = contentOrigin
      ? offsetToPoint(content, valueStart, contentOrigin)
      : undefined

    fields.push({
      type: 'Field',
      key,
      value: parseValue(trimmedValue, fieldPosition, valueOrigin),
      position: fieldPosition,
    })
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
    // Offsets of the field being collected, so it can carry its own position
    let fieldStart = -1
    let fieldEnd = -1
    let valueStart = -1
    let commentStart = -1

    for (let i = 0; i <= content.length; i++) {
      const char = i < content.length ? content[i] : ',' // Add a comma at the end to process the last field
      const prevChar = i > 0 ? content[i - 1] : ''
      const nextChar = i < content.length - 1 ? content[i + 1] : ''

      // Handle comments
      if (!inQuote && !inBlockComment && char === '/' && nextChar === '/') {
        inLineComment = true
        commentBuffer = '//'
        commentStart = i
        i++ // Skip the next slash
        continue
      }

      if (!inQuote && !inLineComment && char === '/' && nextChar === '*') {
        inBlockComment = true
        commentBuffer = '/*'
        commentStart = i
        i++ // Skip the next asterisk
        continue
      }

      // End of line comment
      if (inLineComment && (char === '\n' || i === content.length)) {
        fields.push({
          type: 'Comment',
          value: commentBuffer.slice(2).trim(),
          isLineComment: true,
          position: spanPosition(
            content,
            commentStart,
            i,
            contentOrigin,
            position
          ),
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
          position: spanPosition(
            content,
            commentStart,
            i + 2,
            contentOrigin,
            position
          ),
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
        valueStart = i + 1
        continue
      }

      // Handle value separator (comma or whitespace followed by a new key)
      if (
        (char === ',' && inQuote === null && inObject === 0 && inArray === 0) ||
        ((char === ' ' || char === '\n') &&
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
          processFieldValue(
            currentKey.trim(),
            currentValue.trim(),
            fieldStart,
            fieldEnd,
            valueStart
          )
        }
        currentKey = ''
        currentValue = ''
        collectingKey = true
        fieldStart = -1
        fieldEnd = -1
        valueStart = -1
        continue
      }

      // Collect characters
      if (i < content.length && !/\s/.test(char)) {
        if (fieldStart === -1) fieldStart = i
        fieldEnd = i + 1
      }

      if (collectingKey) {
        currentKey += char
      } else {
        currentValue += char
      }
    }

    // Process the last field if there's any remaining key/value
    // This handles the case where the object doesn't end with a comma
    if (currentKey && !collectingKey) {
      processFieldValue(
        currentKey.trim(),
        currentValue.trim(),
        fieldStart,
        fieldEnd,
        valueStart
      )
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
  position?: Position,
  origin?: ValueOrigin
): ArrayValue {
  const elements: Array<ArrayElement | CommentNode> = []
  const content = value.trim().slice(1, -1)
  // Character zero of `content` is the one right after the opening bracket
  const contentOrigin = origin ? offsetToPoint(value, 1, origin) : undefined

  // Helper function to process a value and add it to elements
  const processValue = (value: string, start: number, end: number) => {
    if (!value.trim()) return

    const elementPosition = spanPosition(
      content,
      start,
      end,
      contentOrigin,
      position
    )
    const elementOrigin = contentOrigin
      ? offsetToPoint(content, start, contentOrigin)
      : undefined

    elements.push({
      type: 'Element',
      value: parseValue(value.trim(), elementPosition, elementOrigin),
      position: elementPosition,
    })
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
    // Offsets of the element being collected, so it can carry its own position
    let elementStart = -1
    let elementEnd = -1
    let commentStart = -1

    for (let i = 0; i <= content.length; i++) {
      const char = i < content.length ? content[i] : ',' // Add a comma at the end to process the last element
      const prevChar = i > 0 ? content[i - 1] : ''
      const nextChar = i < content.length - 1 ? content[i + 1] : ''

      // Handle comments
      if (!inQuote && !inBlockComment && char === '/' && nextChar === '/') {
        inLineComment = true
        commentBuffer = '//'
        commentStart = i
        i++ // Skip the next slash
        continue
      }

      if (!inQuote && !inLineComment && char === '/' && nextChar === '*') {
        inBlockComment = true
        commentBuffer = '/*'
        commentStart = i
        i++ // Skip the next asterisk
        continue
      }

      // End of line comment
      if (inLineComment && (char === '\n' || i === content.length)) {
        elements.push({
          type: 'Comment',
          value: commentBuffer.slice(2).trim(),
          isLineComment: true,
          position: spanPosition(
            content,
            commentStart,
            i,
            contentOrigin,
            position
          ),
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
          position: spanPosition(
            content,
            commentStart,
            i + 2,
            contentOrigin,
            position
          ),
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
        ((char === ' ' || char === '\n') &&
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
        processValue(currentValue.trim(), elementStart, elementEnd)
        currentValue = ''
        elementStart = -1
        elementEnd = -1
        continue
      }

      // Collect characters
      if (i < content.length && !/\s/.test(char)) {
        if (elementStart === -1) elementStart = i
        elementEnd = i + 1
      }

      currentValue += char
    }

    // Process the last element if there's any remaining value
    // This handles the case where the array doesn't end with a comma
    if (currentValue.trim()) {
      processValue(currentValue.trim(), elementStart, elementEnd)
    }
  }

  return {
    type: 'Array',
    elements,
    position,
  }
}
