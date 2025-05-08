# Blocks and Schema Specification

This document defines the schema format for TML (Typed Markup Language), specifying how to declare blocks, attributes, values, grouping constructs, and constraints with clarity and precision.

---

## 1. Node Definitions

TML schemas are composed of nodes of three primary types: `block`, `attr`, and `value`. Each node can have constraints on its name, cardinality, type, and content.

### Node Properties

- **name**: The identifier of the node. Can be a string or an array of strings.
  If it is a string, it is a single name.
  If it is an array, it is a list of names that are all valid names for the node.
- **nameIsPattern** (boolean): If `true`, the `name` is interpreted as a regex pattern matching multiple keys. If `name` is an array, all values in the array are treated as patterns.
- **min** (integer): Minimum occurrences of the node. Defaults to `1` if `nameIsPattern` is `false`, otherwise `0`.
- **max** (integer or `'unbound'`): Maximum occurrences of the node. Defaults to `1` if `nameIsPattern` is `false`, otherwise `'unbound'`.
- **type/value definitions**: Constraints and typing information describing the node’s content.

### Defaults

| Condition              | min | max       |
| ---------------------- | --- | --------- |
| `nameIsPattern: false` | 1   | 1         |
| `nameIsPattern: true`  | 0   | 'unbound' |

### Examples

```tml
block name=user
  attr name=firstName: { type: string, minLength: 1 }
  attr name=lastName: { type: string, minLength: 1 }
```

```tml
attr name=/^x-/ nameIsPattern=true min=0 max=unbound: { type: string }
```

```tml
block name=emails min=0 max=unbound
  block name=email
    value: { type: string, format: email }
```

```tml
# Valid TML
user
  firstName: "Alice"
  lastName: "Smith"

# Invalid TML (missing lastName)
user
  firstName: "Alice"
```

---

## 2. Grouping Constructs

Grouping constructs control the arrangement and cardinality of child nodes. They can be nested arbitrarily and apply to any node type (`block`, `attr`, or `value`).

### Supported Groupings

- **unordered**: Children may appear in any order.
- **ordered**: Children must appear in the specified order.
- **oneOf**: Exactly one of the specified children must appear.

### Behavior

- If nodes are listed without an explicit grouping, they behave as if wrapped in an implicit `unordered`.
- Groupings can be nested to express complex structures.
- Cardinality constraints (`min`, `max`) apply to the grouping as a whole.

### Examples

#### Unordered (explicit)

```tml
block name=user
  unordered
    attr name=firstName: { type: string }
    attr name=lastName: { type: string }
```

#### Unordered (implicit)

```tml
block name=user
  attr name=firstName: { type: string }
  attr name=lastName: { type: string }
```

#### Ordered

```tml
block name=address
  ordered
    block name=street
      value: { type: string }
    block name=city
      value: { type: string }
```

#### oneOf

```tml
block name=contact
  oneOf
    attr name=email: { type: string, format: email }
    attr name=phone: { type: string, pattern: "^[0-9]+$" }
```

```tml
# Valid TML
contact
  phone: "123456789"

# Invalid TML (both fields present)
contact
  email: "a@b.com"
  phone: "123456789"
```

---

## 3. Value Types and Constraints

TML supports a set of built-in value types with associated constraints.

### Supported Types

- **string**
- **number**
- **boolean**
- **array**
- **object**
- **enum**

### Common Constraints

#### string

- `type: 'string'`
- `minLength` (default 0)
- `maxLength` (default `'unbound'`)
- `format` (e.g., email, url)
- `pattern` (regex)
- Both `format` and `pattern` can be specified together; values must satisfy both.

```tml
# Valid TML
email: "user@example.com"

# Invalid TML (wrong format)
email: "not-an-email"
```

#### number

- `type: 'number'`
- `min` (default -Infinity)
- `max` (default Infinity)
- `step` (default 1)

#### boolean

- `type: 'boolean'`

#### array

- `type: 'array'`
- `element` (value type definition)
- `minItems` (default 0)
- `maxItems` (default `'unbound'`)
- `uniqueItems` (default false)

#### object

- `type: 'object'`
- `fields` (map of named fields)
- `minProperties` (default 0)

#### const

- `type: 'const'`
- `value` (the only allowed value)

```tml
# Schema
attr name=status: { type: 'const', value: 'active' }

# Valid TML
status: "active"

# Invalid TML (wrong value)
status: "inactive"
```

#### enum

- `type: 'enum'`
- `values` (list of possible values)

### Custom Validation Errors

Each value definition may include an optional `errorMessage` field, which overrides the default validation error message when the constraint fails.

This is useful for communicating domain-specific requirements or offering clearer guidance to the user.

```tml
attr name=email:
  type: string
  pattern: "^[a-z]+@example\\.com$"
  errorMessage: "Email must be a lowercase @example.com address"
```

```tml
# Invalid TML (violates pattern)
email: "John.Doe@gmail.com"

# Error shown:
# → Email must be a lowercase @example.com address
```

The `errorMessage` can be applied to any value constraint, including `type`, `format`, `enum`, `min`, `max`, etc.

---

## 4. Pattern Matching on Names

Nodes can use regex patterns in their `name` property by setting `nameIsPattern: true`. This allows the node to match multiple keys in the document.

### Example

```tml
attr name=/^x-/ nameIsPattern=true min=0 max=unbound: { type: string }
```

This matches attributes like `x-custom`, `x-flag`, etc.

```tml
# Valid TML
metadata
  x-foo: "bar"
  x-theme: "dark"

# Invalid TML (non-matching name)
metadata
  custom: "value"
```

---

## 5. `$ref` and Definitions

### 5.1 Definitions

Reusable schema fragments can be declared using `definition` blocks.

```tml
definition name=emailType
  value: { type: string, format: email, minLength: 1, maxLength: 50 }
```

### Reusable Node Definitions

A `definition` block may include an entire `block`, `attr`, or `value` node. These definitions can be reused in schemas using `$ref` as a standalone node.

#### Example: attr definition

```tml
definition name=emailAttr
  attr name=email: { type: string, format: email }
```

Usage:

```tml
block name=user
  $ref: emailAttr
```

```tml
# Valid TML
user
  email: "john@site.com"

# Invalid TML (wrong format)
user
  email: "not-an-email"
```

#### Example: block definition

```tml
definition name=contactBlock
  block name=contact
    oneOf
      attr name=phone: { type: string, pattern: "^[0-9]+$" }
      attr name=email: { type: string, format: email }
```

Usage:

```tml
$ref: contactBlock
```

```tml
# Valid TML
contact
  phone: "123456789"

# Invalid TML (both fields present violates oneOf)
contact
  email: "a@b.com"
  phone: "123456789"
```

#### Example: value definition (as before)

```tml
definition name=nameValue
  value: { type: string, minLength: 1 }
```

Usage:

```tml
attr name=firstName: { $ref: nameValue }
```

```tml
# Valid TML
firstName="Alice"

# Invalid TML (too short)
firstName=""
```

Reusable node definitions allow composing schemas from named fragments. When a `$ref` is used as a node, it is replaced entirely by the referenced node.

When used as a node, `$ref` replaces itself with the full node content from the named definition. When used inside a value object, it only substitutes the value definition.

### Using `$ref`

Any node can reference a definition by using `$ref` inside its value object:

```tml
attr name=email: { $ref: emailType }
```

or

```tml
block name=contactEmail
  value: { $ref: emailType }
```

```tml
# Valid TML
user
  email: "john@site.com"

# Invalid TML (email too short)
user
  email: "x@x"
```

---

## 6. Validation Semantics

- The root schema is a list of nodes.
- Validation proceeds recursively through nodes and their children.
- `$ref` references must be resolved before validation continues.
- Nodes must respect their cardinality (`min`, `max`), name matching (including regex patterns), and type constraints.
- Grouping constructs enforce ordering and exclusivity constraints.
- Validation fails if required nodes are missing, extra nodes violate cardinality, or values do not satisfy constraints.

---

## 7. Examples

### Example: Using `$ref`

```tml
definition name=emailType
  value: { type: string, format: email, minLength: 1, maxLength: 50 }

block name=user
  attr name=email: { $ref: emailType }
```

### Example: Grouping with `oneOf`

```tml
block name=contact
  oneOf
    attr name=email: { type: string, format: email }
    attr name=phone: { type: string, pattern: "^[0-9]+$" }
```

### Example: Nested Groupings

```tml
block name=profile
  unordered
    attr name=firstName: { type: string }
    ordered
      attr name=age: { type: number, min: 0 }
      attr name=gender: { type: enum, values: [ "male", "female", "other" ] }
```

### Example: Pattern-Based Names with Cardinality

```tml
block name=metadata
  attr name=/^x-/ nameIsPattern=true min=0 max=unbound: { type: string }
```

---

This specification provides a concise and expressive way to describe TML document structure, typing, and validation rules, supporting reuse, flexible grouping, and precise constraints.
