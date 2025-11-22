import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Compact Fibonacci', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    it('should generate Fibonacci sequence', () => {
        const finalCode = [
            0x1, 0xE, // LDA E
            0xE,      // OUT
            0x2, 0xD, // ADD D
            0x4, 0xE, // STA E
            0x3, 0xD, // SUB D
            0x4, 0xD, // STA D
            0x6, 0x0, // JMP 0
            0x0,      // D: prev=0
            0x1       // E: curr=1
        ];
        
        computer.ram.loadProgram(finalCode);
        
        const runLoop = () => {
            for(let i=0; i<56; i++) computer.clockTick();
        };

        // Iter 1: Output 1
        runLoop();
        expect(computer.out.read()).toBe(1);
        
        // Iter 2: Output 1
        runLoop();
        expect(computer.out.read()).toBe(1);
        
        // Iter 3: Output 2
        runLoop();
        expect(computer.out.read()).toBe(2);
        
        // Iter 4: Output 3
        runLoop();
        expect(computer.out.read()).toBe(3);
        
        // Iter 5: Output 5
        runLoop();
        expect(computer.out.read()).toBe(5);
        
        // Iter 6: Output 8
        runLoop();
        expect(computer.out.read()).toBe(8);
        
        // Iter 7: Output 13 (D)
        runLoop();
        expect(computer.out.read()).toBe(13);
        
        // Iter 8: Output 5 (21 -> 5)
        runLoop();
        expect(computer.out.read()).toBe(5);
    });
});
