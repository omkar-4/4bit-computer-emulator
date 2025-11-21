import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Debug ADD', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    it('should load B correctly in T6', () => {
        // Program: ADD 6
        computer.ram.loadProgram([
            0x2, 0x6, // ADD 6
            0x0, 0x0, 0x0, 0x0,
            0x1       // Addr 6: 1
        ]);
        
        // A starts at 0.
        
        // T1-T3: Fetch Opcode
        computer.clockTick(); // T1
        computer.clockTick(); // T2
        computer.clockTick(); // T3
        expect(computer.ir.read()).toBe(0x2); // ADD

        // T4: Fetch Operand Addr
        computer.clockTick(); // T4
        
        // T5: Read Operand -> MAR
        computer.clockTick(); // T5
        expect(computer.mar.read()).toBe(0x6); // MAR should be 6

        // T6: Read Data -> B
        computer.clockTick(); // T6
        expect(computer.b.read()).toBe(0x1); // B should be 1

        // T7: ALU -> A
        computer.clockTick(); // T7
        expect(computer.a.read()).toBe(1); // 0 + 1 = 1
    });
});
