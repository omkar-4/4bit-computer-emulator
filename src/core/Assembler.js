import { OPCODES } from './constants.js';

export class Assembler {
    constructor() {
        // Reverse map for easy lookup
        this.mnemonicMap = {};
        Object.keys(OPCODES).forEach(key => {
            this.mnemonicMap[key] = OPCODES[key];
        });
    }

    assemble(source) {
        const lines = source.split('\n');
        const cleanedLines = [];
        const labels = {};
        let address = 0;

        // Pass 1: Clean, parse labels, and map addresses
        lines.forEach((line, index) => {
            // Remove comments and whitespace
            let clean = line.split('//')[0].split(';')[0].trim();
            if (!clean) return;

            // Check for label
            if (clean.endsWith(':')) {
                const label = clean.slice(0, -1);
                labels[label] = address;
                return; // Label line doesn't take space itself (unless on same line? Let's assume separate lines for simplicity)
            }
            
            // Handle "Label: Instruction" on same line
            const labelMatch = clean.match(/^(\w+):\s*(.*)/);
            if (labelMatch) {
                labels[labelMatch[1]] = address;
                clean = labelMatch[2].trim();
                if (!clean) return;
            }

            cleanedLines.push({ text: clean, addr: address, originalLine: index + 1 });
            
            // Calculate size
            const parts = clean.split(/\s+/);
            const mnemonic = parts[0].toUpperCase();
            
            if (mnemonic === 'DATA') {
                address += 1;
            } else {
                // Instructions are 1 or 2 nibbles?
                // In our model:
                // NOP, OUT, HLT -> 1 nibble?
                // LDA, ADD... -> 2 nibbles (Op + Operand)
                
                // Wait, our RAM is 16 nibbles.
                // If we use 2 nibbles for everything, we fit 8 instructions.
                // Let's standardize: All instructions take 2 nibbles for simplicity in this Assembler?
                // Or be smart.
                // ControlUnit supports 1-nibble ops (OUT, HLT).
                // But PC increments by 1.
                // If OUT is at 0, PC becomes 1. Next op at 1.
                // If LDA 5 is at 0. Op at 0. Operand at 1. PC becomes 2. Next op at 2.
                
                // So we need to know if it's a 2-byte op.
                if (['LDA', 'ADD', 'SUB', 'STA', 'LDI', 'JMP', 'JC', 'JZ'].includes(mnemonic)) {
                    address += 2;
                } else {
                    address += 1;
                }
            }
        });

        // Pass 2: Generate Machine Code
        const machineCode = new Array(16).fill(0);
        let currentAddr = 0;

        for (const line of cleanedLines) {
            const parts = line.text.split(/\s+/);
            const mnemonic = parts[0].toUpperCase();

            if (currentAddr >= 16) {
                throw new Error(`Program too large! Exceeded 16 nibbles at line ${line.originalLine}`);
            }

            if (mnemonic === 'DATA') {
                const val = parseInt(parts[1]);
                if (isNaN(val)) throw new Error(`Invalid DATA value at line ${line.originalLine}`);
                machineCode[currentAddr] = val & 0xF;
                currentAddr++;
            } else {
                const opcode = this.mnemonicMap[mnemonic];
                if (opcode === undefined) {
                    throw new Error(`Unknown instruction '${mnemonic}' at line ${line.originalLine}`);
                }

                machineCode[currentAddr] = opcode;
                currentAddr++;

                // Handle Operand
                if (['LDA', 'ADD', 'SUB', 'STA', 'LDI', 'JMP', 'JC', 'JZ'].includes(mnemonic)) {
                    if (currentAddr >= 16) throw new Error(`Program too large (operand) at line ${line.originalLine}`);
                    
                    let operandStr = parts[1];
                    if (!operandStr) throw new Error(`Missing operand for ${mnemonic} at line ${line.originalLine}`);
                    
                    let operandVal;
                    // Check if label
                    if (labels[operandStr] !== undefined) {
                        operandVal = labels[operandStr];
                    } else {
                        operandVal = parseInt(operandStr);
                    }

                    if (isNaN(operandVal)) throw new Error(`Invalid operand '${operandStr}' at line ${line.originalLine}`);
                    
                    machineCode[currentAddr] = operandVal & 0xF;
                    currentAddr++;
                }
            }
        }

        return machineCode;
    }
}
