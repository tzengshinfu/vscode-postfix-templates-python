# Python Postfix Templates

> Postfix templates for Python, including built-in function support.

## Features

This extension provides postfix templates for Python in Visual Studio Code, allowing you to quickly transform expressions using concise dot-suffixes. It is adapted specifically for Python syntax and workflows.

### Key Features
- **For Python syntax:** All logic and templates are designed for Python code.
- **Python AST-based:** Template suggestions and transformations are based on Python's syntax tree.
- **Built-in function support:** Quickly wrap expressions with Python built-in functions (e.g., `.str`, `.len`, `.dict`, `.list`, `.set`, `.tuple`, `.abs`, etc.) using postfix notation.
- **Common Python control flow:** Templates for `if`, `ifelse`, `for`, `forrange`, `return`, `not`, and more.
- **Variable name inference:** Suggests meaningful variable names based on the expression context.
- **Custom templates:** Define your own postfix templates for Python.

## Template Examples

| Template         | Outcome Example               |
|------------------|-------------------------------|
| **.if**          | `if expr:`                    |
| **.ifelse**      | `if expr:`/`else:`            |
| **.for**         | `for item in expr:`           |
| **.forrange**    | `for item in range(expr):`    |
| **.return**      | `return expr`                 |
| **.not**         | `not expr`                    |
| **.str**         | `str(expr)`                   |
| **.len**         | `len(expr)`                   |
| **.dict**        | `dict(expr)`                  |
| **.list**        | `list(expr)`                  |
| **.set**         | `set(expr)`                   |
| **.tuple**       | `tuple(expr)`                 |
| **.abs**         | `abs(expr)`                   |
| ...              | ...                           |

> **Note:** All Python built-in functions can be used as postfix templates. For example, typing `mylist.len` will expand to `len(mylist)`.

## Usage

1. Type an expression in your Python file.
2. Add a dot (`.`) and a supported template keyword (e.g., `mylist.len`).
3. Accept the suggestion to transform the code (e.g., `len(mylist)`).

## Configuration

This extension contributes the following settings:

- `pythonPostfixTemplates.customTemplates`: Array of custom template definitions.
- `pythonPostfixTemplates.customTemplates.mergeMode`: determines how custom templates are shown if they share the same name with built-in template:
  - `append` - both built-in and custom template will be shown
  - `override` - only custom template will be shown (it overrides built-in one)
- `pythonPostfixTemplates.inferVariableName`: Enables variable name inference.
- `pythonPostfixTemplates.disabledBuiltinTemplates`: Disable specific built-in templates.


### Custom Templates

You can define your own postfix templates for Python. Example configuration:

```json
{
  "pythonPostfixTemplates.customTemplates": [
    {
      "name": "custom",
      "description": "Wrap with custom()",
      "body": "custom({{expr}})",
      "when": ["identifier"]
    }
  ]
}
```

- `name`: The postfix keyword.
- `description`: Shown in the suggestion panel.
- `body`: The snippet to insert. Use `{{expr}}` for the selected expression. It supports standard Visual Studio Code [Snippet syntax](https://code.visualstudio.com/docs/editor/userdefinedsnippets#_snippet-syntax).
- `when`: Condition can be zero or more of the following options:
  - `identifier`: simple identifier, ie. `variableName` (inside an if statement or function call arguments)
  - `expression`: can be either a simple expression like `object.property.value` or `array[index]` or a combination of them
  - `binary-expression`: a binary expression, ie. `x > 3`, `x * 100`, `x and y`
  - `unary-expression`: an unary expression, ie. `not x`, `-x` or `~x`
  - `function-call`: a function call expression, ie. `func()`, `object.method()` and so on
  - `string-literal`: string literal, ie. `'a string'` or `"string in double quotes"`
  - `type`: type in function/variable definition, ie. `x: str`

If no conditions are specified then given template will be available under all possible situations

### Infer variable names

For `var` and `for`/`forrange` templates the extension will try to infer a better name for the variable based on the subject expression.
For instance `read_file()` expression will result in variable named `file` instead of default `name`. Same applies to `for`/`forrange` templates, but in this case the extension is trying to figure out a singular form of the subject. Of course this can still be easily changed, it's only a suggestion.

If you have ideas for more "patterns" that could be easily handled please create an issue.

## Known Issues

If you encounter issues or have suggestions for new templates, please open an issue in the repository.
