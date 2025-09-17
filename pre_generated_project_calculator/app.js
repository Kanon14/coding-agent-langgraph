// app.js - Core logic for SimpleCalc
// This script handles calculator operations, UI updates, and keyboard support.

(() => {
  // State variables
  let expression = '';
  let result = '';
  const MAX_LENGTH = 30;

  // DOM references
  const exprEl = document.getElementById('expression');
  const resultEl = document.getElementById('result');
  const buttons = document.querySelectorAll('.buttons-grid button');

  // Utility: Update the calculator display
  function updateDisplay() {
    exprEl.textContent = expression;
    resultEl.textContent = result;
  }

  // Utility: Determine if a character is an operator
  const operators = new Set(['+', '-', '*', '/', '%', '×', '÷']);

  // Append a character to the current expression with validation
  function appendToExpression(char) {
    // Limit length
    if (expression.length >= MAX_LENGTH) return;

    // Prevent multiple consecutive operators (except minus for negative numbers)
    const lastChar = expression.slice(-1);
    if (operators.has(char)) {
      if (expression === '' && char !== '-') return; // can't start with operator except '-'
      if (operators.has(lastChar) && !(char === '-' && lastChar !== '-')) {
        // Replace the previous operator with the new one (except handling '--')
        expression = expression.slice(0, -1) + char;
        updateDisplay();
        return;
      }
    }

    // Prevent multiple decimals in the same number segment
    if (char === '.') {
      // Find the last number segment
      const parts = expression.split(/[+\-*/%]/);
      const lastPart = parts[parts.length - 1];
      if (lastPart.includes('.')) return; // already has a decimal
    }

    expression += char;
    updateDisplay();
  }

  // Calculate the result of the current expression
  function calculate() {
    if (!expression) return;
    try {
      // Replace visual operators with JavaScript equivalents
      const sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/');

      // Evaluate safely using Function constructor
      // Note: This is still executing arbitrary code; in a real app, use a proper parser.
      const evalResult = Function('return ' + sanitized)();

      // Detect division by zero or non‑finite results
      if (typeof evalResult === 'number' && !isFinite(evalResult)) {
        throw new Error('Division by zero');
      }

      result = String(evalResult);
    } catch (e) {
      result = 'Error';
    }
    updateDisplay();
  }

  // Clear only the result (CE)
  function clearEntry() {
    result = '';
    updateDisplay();
  }

  // Reset both expression and result (AC)
  function allClear() {
    expression = '';
    result = '';
    updateDisplay();
  }

  // Handle button clicks based on data-key attribute
  function handleButton(key) {
    switch (key) {
      case '=':
      case 'Enter':
        calculate();
        break;
      case 'C':
        clearEntry();
        break;
      case 'AC':
        allClear();
        break;
      default:
        // For all other keys (digits, operators, decimal, %)
        appendToExpression(key);
        break;
    }
  }

  // Attach click listeners to calculator buttons
  buttons.forEach(btn => {
    btn.addEventListener('click', e => {
      const key = e.target.dataset.key;
      if (key) handleButton(key);
    });
  });

  // Keyboard support mapping
  const keyMap = {
    '0': '0',
    '1': '1',
    '2': '2',
    '3': '3',
    '4': '4',
    '5': '5',
    '6': '6',
    '7': '7',
    '8': '8',
    '9': '9',
    '.': '.',
    '+': '+',
    '-': '-',
    '*': '*',
    'x': '*', // some keyboards use 'x' for multiply
    '/': '/',
    '%': '%',
    'Enter': '=',
    '=': '=',
    'Backspace': 'C',
    'Escape': 'AC',
    'Delete': 'AC'
  };

  document.addEventListener('keydown', e => {
    const mappedKey = keyMap[e.key];
    if (mappedKey) {
      e.preventDefault();
      handleButton(mappedKey);
    }
  });

  // Initial display update
  updateDisplay();
})();
