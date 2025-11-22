import { beforeEach, describe, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Emulator Stress Test Suite Debug', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    it('should run Program 3: Double Value', () => {
        const program = [
            0x1, 0xA, // 0: LDA A
            0x2, 0xA, // 2: ADD A
            0x4, 0xA, // 4: STA A
            0xE,      // 6: OUT
            0xF,      // 7: HLT
            0x0, 0x0, // 8, 9: Pad
            0x3       // A: Data 3
        ];
        computer.ram.loadProgram(program);
        
        console.log('RAM[10]:', computer.ram.read(10)); // Should be 3

        // Run LDA A
        for(let i=0; i<8; i++) computer.clockTick();
        console.log('After LDA A - A:', computer.a.read()); // Should be 3
        
        // Run ADD A
        for(let i=0; i<8; i++) computer.clockTick();
        console.log('After ADD A - A:', computer.a.read()); // Should be 6
        
        // Run STA A
        for(let i=0; i<8; i++) computer.clockTick();
        console.log('After STA A - RAM[10]:', computer.ram.read(10)); // Should be 6
    });
});
