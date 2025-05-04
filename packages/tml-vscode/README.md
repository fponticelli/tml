# TML Language Support for VS Code

This extension provides syntax highlighting for the Typed Markup Language (TML).

## Features

- Syntax highlighting for TML files (`.tml`)
- Support for block structures, attributes, and values
- Support for comments (line and block)
- Support for structured values (objects and arrays)

## TML Syntax Overview

TML is a concise, human-readable markup language for representing hierarchical data, inspired by XML, HTML, YAML, and JSON.

### Basic Syntax

```tml
// This is a comment
html lang=en
  head
    title: My Website
    meta charset=UTF-8
  body
    h1: Welcome to TML
    p: A concise and typed markup language.
    img src=logo.png alt='Site Logo'
    ul
      li: Item 1
      li: Item 2
```

### Attributes and Values

```tml
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

// Arrays
tags: [item1, item2, item3]
```

## Requirements

- VS Code 1.80.0 or higher

## Extension Settings

This extension does not contribute any settings.

## Known Issues

- None at this time

## Release Notes

### 0.0.1

Initial release with basic syntax highlighting.

## License

This extension is licensed under the [MIT License](LICENSE.md).
