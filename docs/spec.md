# Typed Markup Language (TML) — Specification

TML is a concise, human-readable markup language for representing hierarchical data, inspired by XML, YAML, and HAML. It supports typed attributes and values, whitespace-based structure, and is content-agnostic, suitable for documents, configuration files, UI trees, and more.

## 1. Syntax Rules

### 1.1 Indentation

* TML uses **indentation** (spaces or tabs) to indicate hierarchy.
* Nesting is based on line indentation relative to its parent.
* Mixed tabs and spaces are discouraged.

### 1.2 Blocks

* A `BlockNode` starts with a name and optionally attributes and inline children.
* Format: `name attr1=value1 attr2=value2 child1 child2`
* Attributes come first; first non-attribute token begins the child list.
* Block names may begin with `$` to support constructs like `$ref`, `$include`, etc.

```tml
html lang=en
  head title: Hello World
    meta charset=UTF-8
  $ref path="#/some/section"
```

### 1.3 Attributes

* Format: `key=value`
* Types are inferred:

  * Unquoted: `true`, `false`, numbers → parsed as boolean/number
  * Quoted: `'string'` or `"string"` → always a string
  * Object/array: Use JSON-like inline syntax: `{ key: [1, true] }`

```tml
config={ key1: "value1", key2: ["valueA", "valueB"] }
```

* Boolean shortcut: `checked!` → `checked=true`
* Attribute **order is preserved**
* **Multiple attributes with the same name are allowed** and are retained in the order they appear — no assumption is made that the last one wins

### 1.4 Values

* Prefixed with `:`
* A `ValueNode` is an anonymous literal, and can appear inline or nested:

```tml
: true
: "hello"
: { key: [1, true] }
```

* If a colon is used, **everything after the colon on that line is treated as a single value**.
* This means that additional tokens after a colon will not be parsed as child nodes.

```tml
// Valid:
title: Hello World

// This will not work as expected
html head title: Hello body div: Welcome!

// It is equivalent to
html head title: "Hello body div: Welcome!"

// But this works
html
  head title: "Hello"
  body div: Welcome!

// Or:
html
  head
    title: Hello
  body
    div: Welcome!
```

* Single-line: `key: value`
* Multi-line:

```tml
description:
  This is a multiline block
  that will be parsed as a single string
```

### 1.5 Comments

* Line comment: `//` prefix
* Inline comment: `/* comment */` inside attributes or children
* `CommentNode`s may be preserved for tooling but ignored semantically

### 1.6 Inline Nesting

* Blocks can have inline children on the same line:

```tml
html head title: Hello
  body div: Welcome!
```

* Parsed as nested children:

```tml
html
  head
    title: Hello
  body
    div: Welcome!
```

* Indentation after an inline line applies to the **last full block** — not inline children

```tml
html head title: Hello
  meta charset=UTF-8  // belongs to html, not head or title
```

---

## 2. Parsing Behavior

* TML is parsed with a **best-effort strategy**:

  * Recover from errors where possible
  * Invalid input may emit warnings, not crashes
  * Partially valid documents produce partial ASTs

## 3. Example

```tml
$schema: "https://example.com/schema"
$version: 1.0

html lang=en
  head
    title: My Website
    meta charset=UTF-8
    meta name=viewport content='width=device-width' initial-scale=1.0
  body
    h1: Welcome to TML
    p: A concise and typed markup language.
    img src=logo.png alt='Site Logo'
    ul
      li: Item 1
      li: Item 2
    : Footer text here
    // End of document
```
