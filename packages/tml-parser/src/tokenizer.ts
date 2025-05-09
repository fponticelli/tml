/**
 * Tokenizes a line of TML into its components.
 */
export function tokenizeLine(line: string): string[] {
  const tokens: string[] = []
  let current = ''
  let inQuote: string | null = null
  let inObject = 0
  let inArray = 0
  let foundColon = false

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

    // Special handling for colon - if we find a colon outside of quotes, objects, or arrays,
    // and we already have tokens, treat everything after it as a value
    if (
      char === ':' &&
      inQuote === null &&
      inObject === 0 &&
      inArray === 0 &&
      tokens.length > 0
    ) {
      // If we have a current token, add it
      if (current) {
        tokens.push(current)
        current = ''
      }

      // Add the colon as a separate token
      tokens.push(':')

      // Collect the rest of the line as a single token for the value
      if (i < line.length - 1) {
        tokens.push(line.substring(i + 1).trim())
      }

      // We're done processing this line
      foundColon = true
      break
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

  // Add the last token if there is one and we didn't find a colon
  if (current && !foundColon) {
    tokens.push(current)
  }

  return tokens
}
