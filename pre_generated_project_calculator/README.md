# SimpleCalc

## Project Title & Description
**SimpleCalc** is a lightweight, web‑based calculator that provides a clean and responsive user interface for performing basic arithmetic operations. It supports both mouse clicks and keyboard input, offering a seamless experience across desktop and mobile browsers.

## Tech Stack
- **HTML** – Structure of the calculator UI.
- **CSS** – Styling and responsive layout.
- **JavaScript** – Core logic for handling input, performing calculations, validation, and UI updates.

## Features
- **Input Methods**: Clickable on‑screen buttons and full keyboard support (numbers, operators, Enter for `=` and Escape for `C`).
- **Operations**: Addition, subtraction, multiplication, division, decimal handling, and sign toggle.
- **Clear Functions**:
  - `C` – Clear the entire expression.
  - `CE` – Clear the current entry.
- **Responsive UI**: Adjusts layout for different screen sizes and orientations.
- **Validation & Error Handling**:
  - Prevents invalid sequences (e.g., multiple operators).
  - Handles division by zero and displays a friendly error message.
  - Limits input length to keep the display readable.

## Setup Instructions
1. **Clone the repository**
   ```bash
   git clone https://github.com/your‑username/simplecalc.git
   cd simplecalc
   ```
2. **Open the application**
   - Simply open `index.html` in any modern web browser.
   - *Optional*: Run a local static server for a better development experience:
     ```bash
     npx serve .
     ```
     Then navigate to the URL shown in the terminal (usually `http://localhost:5000`).

## Usage Guide
- **Button Layout**:
  - Numbers `0‑9` and `.` are placed in a grid.
  - Operators (`+`, `-`, `*`, `/`) are on the right side.
  - `=` evaluates the expression, `C` clears all, `CE` clears the last entry, and `±` toggles the sign.
- **Keyboard Shortcuts**:
  - Digits `0‑9` and `.` – Enter numbers.
  - `+`, `-`, `*`, `/` – Operators.
  - `Enter` or `=` – Evaluate.
  - `Backspace` – Delete the last character.
  - `Escape` – Clear all (`C`).
- **Error Display**:
  - When an invalid operation occurs (e.g., division by zero), the calculator shows a brief error message in the display area and resets the input after a short delay.

## Development Notes
- **File Responsibilities**
  - `index.html` – Markup for the calculator layout.
  - `styles.css` – All visual styling, including responsive breakpoints.
  - `script.js` – Core JavaScript logic: event listeners, expression parsing, calculation, and UI updates.
- **Adding New Operations**
  - Extend the `calculate` function in `script.js` to handle additional operators (e.g., `%`, `^`).
  - Update the button grid in `index.html` and add corresponding CSS styles if needed.
- **Code Organization**
  - The script is modularized into small, pure functions (e.g., `appendNumber`, `appendOperator`, `evaluateExpression`). This makes it easy to test and extend.

## License

MIT License

```
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
