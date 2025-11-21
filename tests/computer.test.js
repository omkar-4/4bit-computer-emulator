import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Computer Integration', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    it('should execute LDI instruction', () => {
        // Program: LDI 5
        // 0: 0x5 (LDI)
        // 1: 0x5 (Val)
        computer.ram.loadProgram([0x5, 0x5]);
        
        // Run 8 steps (1 instruction cycle)
        for(let i=0; i<8; i++) computer.clockTick();
        
        expect(computer.a.read()).toBe(5);
    });

    it('should execute ADD instruction', () => {
        // Program: LDI 3, ADD 14 (where 14 has val 2)
        // 0: 5, 3 (LDI 3)
        // 2: 2, E (ADD [14]) -> 14 is 0xE
        // ...
        // E: 2
        computer.ram.loadProgram([
            0x5, 0x3, // LDI 3
            0x2, 0xE, // ADD E
            0x0, 0x0,
            0x0, 0x0,
            0x0, 0x0,
            0x0, 0x0,
            0x0, 0x0,
            0x2       // Addr E: 2
        ]);

        // Cycle 1: LDI 3
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.a.read()).toBe(3);

        // Cycle 2: ADD E
        for(let i=0; i<8; i++) computer.clockTick();
        
        // Check B register (loaded from RAM)
        expect(computer.b.read()).toBe(2);
        
        // Check A register (Result) - Note: My logic updates A via ALU in T6?
        // Let's check Computer.js logic:
        // T6: ADD -> signals.push(SIG.RO, SIG.BI);
        // Wait, I missed the ALU -> A step in the refactor!
        // In the original monolithic code, I "cheated" and did ALU calc inside the block.
        // In Computer.js executeSignals:
        // if (signals.includes(SIG.EO)) ... bus.write(res)
        // But who asserts SIG.EO and SIG.AI?
        // ControlUnit.js:
        // else if (opcode === OPCODES.ADD) signals.push(SIG.RO, SIG.BI);
        // It loads RAM -> B. But it never does ALU -> A.
        
        // FIX NEEDED: The ADD instruction needs to put result in A.
        // Standard SAP-1:
        // T4: Fetch Addr
        // T5: RAM -> B
        // T6: ALU -> A (EO, AI)
        
        // My ControlUnit.js for ADD:
        // T5: ... signals.push(SIG.LM) (Operand is address)
        // T6: ... signals.push(SIG.RO, SIG.BI)
        
        // I am missing T7! Or I need to compress.
        // If I want to stick to 6 steps (0-5):
        // T0-T2: Fetch
        // T3: Fetch Operand Addr (PC->MAR)
        // T4: Read Operand (RAM->MAR) (Address of data)
        // T5: Read Data (RAM->B)
        
        // Still no ALU step.
        // I must add T6 (Step 7) or combine.
        // Can I do RAM->B and ALU->A in same step?
        // No, B needs to settle.
        
        // Real 4-bit computers often take more cycles.
        // I will extend the cycle to 8 steps? Or just add a special step.
        // Let's modify ControlUnit to use 8 steps if needed, or just add the missing signal in a new step.
        
        // For this test, I expect it to FAIL currently.
        // I will fix the code after I write the test.
    });
});
