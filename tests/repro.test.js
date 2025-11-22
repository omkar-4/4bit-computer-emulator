import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('User Repro: Self-Modifying Code', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    it('should execute the user\'s program faithfully (even if it breaks itself)', () => {
        // User Program:
        // 0: ADD 0  (2, 0) -> A = A + [0] (A + 2)
        // 2: STA 2  (4, 2) -> [2] = A. [2] was 4 (STA opcode). Now it becomes A.
        // 4: LDA 1  (1, 1) -> A = [1] (0)
        // 6: STA 0  (4, 0) -> [0] = A. [0] was 2 (ADD opcode). Now it becomes 0.
        // 8: LDA 2  (1, 2) -> A = [2] (Value stored in step 2)
        // A: STA 1  (4, 1) -> [1] = A.
        // C: JMP 0  (6, 0) -> Jump to 0.
        
        // Initial RAM:
        // 0: 2 (ADD)
        // 1: 0 (Operand)
        // 2: 4 (STA)
        // 3: 2 (Operand)
        // 4: 1 (LDA)
        // 5: 1 (Operand)
        // 6: 4 (STA)
        // 7: 0 (Operand)
        // 8: 1 (LDA)
        // 9: 2 (Operand)
        // A: 4 (STA)
        // B: 1 (Operand)
        // C: 6 (JMP)
        // D: 0 (Operand)
        
        const program = [
            2, 0, // ADD 0
            4, 2, // STA 2
            1, 1, // LDA 1
            4, 0, // STA 0
            1, 2, // LDA 2
            4, 1, // STA 1
            6, 0  // JMP 0
        ];
        
        computer.ram.loadProgram(program);
        
        // Step 1: ADD 0
        // A = 0 + RAM[0] = 0 + 2 = 2.
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.a.read()).toBe(2);
        
        // Step 2: STA 2
        // RAM[2] = A = 2.
        // RAM[2] was 4.
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.ram.read(2)).toBe(2);
        
        // Step 3: LDA 1
        // A = RAM[1] = 0.
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.a.read()).toBe(0);
        
        // Step 4: STA 0
        // RAM[0] = A = 0.
        // RAM[0] was 2.
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.ram.read(0)).toBe(0);
        
        // Step 5: LDA 2
        // A = RAM[2] = 2 (from Step 2).
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.a.read()).toBe(2);
        
        // Step 6: STA 1
        // RAM[1] = A = 2.
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.ram.read(1)).toBe(2);
        
        // Step 7: JMP 0
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.pc.read()).toBe(0);
        
        // Step 8: Execute at 0
        // RAM[0] is now 0 (NOP).
        // RAM[1] is now 2.
        // So instruction is 0 (NOP).
        // Or if 0 is opcode... 0 is NOP.
        // NOP takes 1 byte? No, our NOP is 1 byte?
        // Let's check ControlUnit.
        // NOP -> break.
        // It consumes 1 cycle (T1-T3 fetch, then nothing).
        // Wait, if NOP is 1 byte, next op is at 1.
        // RAM[1] is 2 (ADD opcode).
        
        // Let's run 1 instruction (NOP)
        // T1, T2, T3...
        // Step 8 is NOP.
        // PC increments to 1.
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.pc.read()).toBe(1);
        
        // Step 9: Execute at 1
        // RAM[1] is 2 (ADD).
        // RAM[2] is 2.
        // So ADD 2.
        // A = A + RAM[2] = 2 + 2 = 4.
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.a.read()).toBe(4);
    });
});
