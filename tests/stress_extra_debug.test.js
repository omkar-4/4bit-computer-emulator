import { beforeEach, describe, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Extra Stress Tests Debug', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

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
        
        const runLoop = (iter) => { 
            for(let i=0; i<50; i++) computer.clockTick(); 
            console.log(`Iter ${iter}: Out=${computer.out.read()} A=${computer.a.read()} RAM[F]=${computer.ram.read(0xF)}`);
        };
        
        // 1 -> 2
        runLoop(1); 
        
        // 2 -> 4
        runLoop(2); 
        
        // 4 -> 8
        runLoop(3); 
        
        // 8 -> 1
        runLoop(4);
    });
});
