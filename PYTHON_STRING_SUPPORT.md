# Python String Literal Support

## Overview
This extension now supports all Python string literal types with their prefixes.

## Supported String Types

### Basic String Literals
- `'string'` - Single quotes
- `"string"` - Double quotes  
- `'''string'''` - Triple single quotes
- `"""string"""` - Triple double quotes

### Unicode Strings (Python 2 compatibility)
- `u'string'`, `u"string"`, `u'''string'''`, `u"""string"""`

### Byte Strings
- `b'string'`, `b"string"`, `b'''string'''`, `b"""string"""`

### Raw Strings (no escape processing)
- `r'string'`, `r"string"`, `r'''string'''`, `r"""string"""`

### Combined Prefixes
- `ur'string'`, `ur"string"` - Raw Unicode (Python 2)
- `ru'string'`, `ru"string"` - Raw Unicode (alternative order)
- `rb'string'`, `rb"string"` - Raw Bytes
- `br'string'`, `br"string"` - Raw Bytes (alternative order)

### F-Strings (formatted string literals)
- `f'string {value}'`, `f"string {value}"` - Basic f-strings
- `f'''string {value}'''`, `f"""string {value}"""` - Triple-quoted f-strings
- `fr'string {value}'`, `fr"string {value}"` - Raw f-strings
- `rf'string {value}'`, `rf"string {value}"` - Raw f-strings (alternative order)

## Implementation Details

### AST Node Detection
The extension uses tree-sitter-python for parsing, which represents strings with this structure:
```
string
├── string_start (contains prefix + opening quote, e.g., "tr\"" or "f'")
├── string_content (the actual content)
└── string_end (closing quote)
```

When the cursor is positioned after a string (e.g., `tr"text".`), the AST detection:
1. Identifies the `string_end` node type
2. Returns the parent `string` node
3. The `.text` property of the string node includes the full string WITH its prefix

### String Prefix Handling
The string prefix (like `tr`, `f`, `r`, `b`, `u`, etc.) is automatically included in the string node's text by tree-sitter. No special prefix extraction is needed because:
- Tree-sitter's `string_start` child node contains the prefix
- The parent `string` node's `.text` property includes all children
- This means expressions like `tr"template".var` correctly capture `tr"template"` as the complete expression

### Test Coverage
Comprehensive test cases have been added for:
- All string prefix combinations
- Single and double quotes
- Triple-quoted strings
- Strings with interpolation (f-strings, t-strings)
- Various templates (var, print, return) with different string types

## Usage Examples

All postfix templates work with any string type:

```python
# var template
fr"template".var
# Result: name = fr"template"

# print template
f"value: {x}".print
# Result: print(f"value: {x}")

# return template
rb"raw bytes".return  
# Result: return rb"raw bytes"

# for template
b"items".for
# Result: for item in b"items":
```

## Notes
- The extension correctly handles all standard Python string prefix combinations
- T-strings (PEP 750) are NOT yet supported as they are still experimental
- Nested quotes and interpolations are properly preserved
- Raw strings (r-prefix) maintain their backslash behavior
