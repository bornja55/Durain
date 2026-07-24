# AI Handoff & Developer Guidelines

This document contains critical rules and gotchas for any AI assistant or developer working on the Durian Management System (Google Apps Script).

## 1. Google Apps Script HTML Service Limitations

### 1.1 Do NOT use Backticks (Template Literals) in HTML files
- **Rule:** Never use ES6 template literals (`` ` ``) containing string interpolation inside `.html` or `.js.html` files.
- **Reason:** GAS compiles HTML files using `HtmlService`. The backend template engine aggressively minifies and escapes strings. If backticks contain HTML tags like `<img src="${url}">` or `<div>`, the GAS compiler frequently produces malformed JavaScript (e.g., `missing ) after argument list`) when generating the iframe sandbox payload.
- **Workaround:** Always use string concatenation (`+`) with single (`'`) or double (`"`) quotes. Use `\x3C` for `<` and `\x3E` for `>` if necessary to avoid confusing the HTML parser when building HTML strings inside JavaScript.

### 1.2 Multi-line HTML Strings
- **Rule:** Instead of multi-line backticks, use string concatenation with newlines or arrays joined by empty strings.
- **Example:**
  ```javascript
  // BAD
  html += `
    <div class="card">
      <p>${name}</p>
    </div>
  `;

  // GOOD
  html += '<div class="card">' +
            '<p>' + name + '</p>' +
          '</div>';
  ```

## 2. Global Scope & IIFEs
- **Architecture:** The client-side code uses Immediately Invoked Function Expressions (IIFEs) like `const DashboardVM = (function() { ... })();` to encapsulate logic.
- **Rule:** When modifying or replacing code inside these IIFEs, ensure that you match the correct IIFE by looking at the surrounding context (especially the closing `return { ... }` statements).
- **Gotcha:** Many IIFEs have similar structures or identical `return { load, render };` lines. When using AI replacement tools, ensure search contexts are extremely precise so as not to patch the wrong module.

## 3. UI Framework & Tailwind
- **Rule:** The project uses Tailwind CSS via CDN. Do not introduce build steps or npm packages for frontend styling. Stick to standard utility classes.
- **Icons:** Use Google Material Symbols (`<span class="material-symbols-rounded"></span>`).

## 4. Uncaught Errors During Initialization
- **Rule:** Avoid executing complex logic immediately at the top level of an IIFE or in the global scope. If an error is thrown during script evaluation (before the page fully loads), all subsequent IIFEs and event listeners will fail to initialize, causing `Cannot access 'X' before initialization` errors across the entire app.
- **Workaround:** Wrap initialization logic inside functions like `init()` or `load()` and call them from `window.onload` or a central orchestrator like `AuthVM.onAccessSuccess()`.

## 5. Event Binding
- **Rule:** Inline event handlers (like `onclick="foo()"`) are acceptable for simple navigation, but complex actions should use event delegation to avoid scope issues within the `userCodeAppPanel` iframe sandbox.
- **Example:** Use `document.addEventListener('click', (e) => { ... })` for dynamic elements (like generated lists of trees or history items).
