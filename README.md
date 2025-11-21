# 4-Bit Computer Emulator

A fully functional, visually realistic 4-bit computer emulator built with Vanilla JS and Vite.

## Features
- **Modular Architecture**: Separated Core Logic (CPU, RAM, Bus) from UI.
- **Visual Interface**: Real-time visualization of data flow, registers, and control signals.
- **8-Step Instruction Cycle**: Realistic Fetch-Decode-Execute cycle with T-states.
- **Test Coverage**: Unit and Integration tests using Vitest.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Run tests:
   ```bash
   npm test
   ```

## Architecture
- `src/core/`: Contains the emulator logic (Computer, ControlUnit, ALU, etc).
- `src/main.js`: Entry point, handles UI binding.
- `tests/`: Vitest test suites.
