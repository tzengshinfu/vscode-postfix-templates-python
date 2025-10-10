# Project Overview

This project is a Visual Studio Code extension that provides postfix completion for Python. Postfix completion allows developers to transform an expression into a different one by typing a dot `.` and a template name after the expression.

The extension is written in TypeScript and uses a [tree-sitter](https://tree-sitter.github.io/tree-sitter/) parser to analyze the Python code and provide accurate completions.

## Key Technologies

*   **TypeScript:** The primary language used to develop the extension.
*   **VS Code API:** Used to interact with the Visual Studio Code editor and provide features like code completion.
*   **Tree-sitter:** A parser generator tool and an incremental parsing library. It is used to parse the Python code and build a syntax tree.
*   **Mocha:** A JavaScript test framework used for running the extension's tests.

# Building and Running

## Prerequisites

*   [Node.js](https://nodejs.org/) (which includes npm)
*   [Visual Studio Code](https://code.visualstudio.com/)

## Building

To build the extension, run the following command:

```sh
npm run compile
```

This will compile the TypeScript code and output the JavaScript files to the `out` directory.

## Running in VS Code

You can run the extension in a new VS Code window for development and testing:

1.  Open the project in Visual Studio Code.
2.  Press `F5` to open a new window with the extension loaded.
3.  Open a Python file (`.py`) to test the postfix completions.

## Running Tests

To run the tests, use the following command:

```sh
npm test
```

This will run the tests using Mocha and output the results to the console.

To run the tests with coverage, use the following command:

```sh
npm run test-with-coverage
```

## Linting

To lint the code, use the following command:

```sh
npm run lint
```

# Development Conventions

*   **Coding Style:** The project uses [ESLint](https://eslint.org/) to enforce a consistent coding style. The ESLint configuration can be found in the `.eslintrc.js` file.
*   **Testing:** The project uses [Mocha](https://mochajs.org/) for testing. Tests are located in the `test` directory.
*   **Commit Messages:** The project does not have a strict commit message format, but it is recommended to write clear and descriptive commit messages.
*   **Pull Requests:** Pull requests are welcome. Please make sure to run the tests and lint the code before submitting a pull request.
