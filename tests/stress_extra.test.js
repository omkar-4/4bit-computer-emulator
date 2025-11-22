import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Extra Stress Tests', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    // Program 5: Rotate Left (1, 2, 4, 8, 1...)
    it('should run Program 5: Rotate Left', () => {
        const programRotate = [
            0x1, 0xF, // 0: LDA F
            0x2, 0xF, // 2: ADD F
            0x7, 0x8, // 4: JC 8
            0x6, 0xA, // 6: JMP A
            0x2, 0x0, // 8: ADD 0 (Adds 1)
            0x4, 0xF, // A: STA F
            0xE,      // C: OUT
            0x6, 0x0, // D: JMP 0
            0x1       // F: 1
        ];
        
        computer.ram.loadProgram(programRotate);
        
        const runLoop = () => { for(let i=0; i<60; i++) computer.clockTick(); };
        
        // 1 -> 2
        runLoop(); expect(computer.out.read()).toBe(2);
        
        // 2 -> 4
        runLoop(); expect(computer.out.read()).toBe(4);
        
        // 4 -> 8
        runLoop(); expect(computer.out.read()).toBe(8);
        
        // 8 -> 16(0) + 1 = 1
        runLoop(); expect(computer.out.read()).toBe(1);
        
        // 1 -> 2
        runLoop(); expect(computer.out.read()).toBe(2);
    });

    // Program 6: Sum Array (Sum [13, 14, 15])
    it('should run Program 6: Sum Array', () => {
        const programSum = [
            0x1, 0xD, // 0: LDA D
            0x2, 0xE, // 2: ADD E
            0x2, 0xF, // 4: ADD F
            0xE,      // 6: OUT
            0xF,      // 7: HLT
            0x0, 0x0, 0x0, 0x0, 0x0, // Pad 8, 9, A, B, C
            0x3,      // D: 3
            0x4,      // E: 4
            0x5       // F: 5
        ];
        
        computer.ram.loadProgram(programSum);
        
        for(let i=0; i<50; i++) computer.clockTick();
        
        expect(computer.isHalted).toBe(true);
        expect(computer.out.read()).toBe(12);
    });
});
