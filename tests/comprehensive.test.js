import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Computer Comprehensive', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    it('should execute JMP correctly (no off-by-one)', () => {
        // 0: JMP 4
        // 2: 0 (Skipped)
        // 3: 0 (Skipped)
        // 4: LDI 5
        computer.ram.loadProgram([
            0x6, 0x4, // JMP 4
            0x0, 0x0,
            0x5, 0x5, // LDI 5
            0xF       // HLT
        ]);

        // Run enough steps
        for(let i=0; i<20; i++) computer.clockTick();
        
        expect(computer.pc.read()).toBeGreaterThan(4);
        expect(computer.a.read()).toBe(5);
    });

    it('should execute JZ (Jump if Zero) correctly', () => {
        // 0: LDI 0
        // 2: JZ 6
        // 4: LDI 9 (Should be skipped)
        // 6: LDI 5
        computer.ram.loadProgram([
            0x5, 0x0, // LDI 0 (Z flag set?)
            0x8, 0x6, // JZ 6
            0x5, 0x9, // LDI 9
            0x5, 0x5, // LDI 5
            0xF
        ]);
        
        // We need to ensure Z flag is set. LDI 0 sets A=0.
        // Does LDI update ALU flags?
        // In current implementation, LDI does NOT go through ALU.
        // So Z flag might not be set!
        // We might need "ADD 0" to set flags?
        // Or LDI should update flags?
        // Standard SAP-1: LDI does not affect flags.
        // So we need: LDI 0, ADD 15 (where 15 is 0).
        
        // Let's use ADD to set flags.
        // 0: LDI 0
        // 2: ADD 14 (Val 0) -> Z=1
        // 4: JZ 8
        // 6: LDI 9 (Skipped)
        // 8: LDI 5
        
        computer.ram.loadProgram([
            0x5, 0x0, // LDI 0
            0x2, 0xE, // ADD E (Val 0)
            0x8, 0x8, // JZ 8
            0x5, 0x9, // LDI 9
            0x5, 0x5, // LDI 5
            0xF,      // HLT
            0x0, 0x0, // Pad
            0x0       // Addr E: 0
        ]);

        for(let i=0; i<40; i++) computer.clockTick();
        expect(computer.a.read()).toBe(5);
    });

    it('should execute JC (Jump if Carry) correctly', () => {
        // 0: LDI 15
        // 2: ADD 14 (Val 1) -> 16 (Carry=1, A=0)
        // 4: JC 8
        // 6: LDI 9 (Skipped)
        // 8: LDI 5
        computer.ram.loadProgram([
            0x5, 0xF, // LDI 15
            0x2, 0xE, // ADD E (Val 1)
            0x7, 0x8, // JC 8
            0x5, 0x9, // LDI 9
            0x5, 0x5, // LDI 5
            0xF,
            0x0, 0x0,
            0x1       // Addr E: 1
        ]);

        for(let i=0; i<40; i++) computer.clockTick();
        expect(computer.a.read()).toBe(5);
    });
});
