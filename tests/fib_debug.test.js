import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Compact Fibonacci Debug', () => {
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
        
        const runLoop = (iter) => {
            for(let i=0; i<60; i++) computer.clockTick();
            console.log(`Iter ${iter}: Out=${computer.out.read()} Prev=${computer.ram.read(0xD)} Curr=${computer.ram.read(0xE)}`);
        };

        // Iter 1
        runLoop(1);
        expect(computer.out.read()).toBe(1);
        
        // Iter 2
        runLoop(2);
        expect(computer.out.read()).toBe(1);
        
        // Iter 3
        runLoop(3);
        expect(computer.out.read()).toBe(2);
    });
});
