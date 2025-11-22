import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Debug OUT', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    it('should consume 1 byte for OUT', () => {
        // 0: OUT
        // 1: LDI 5
        // 3: HLT
        const program = [
            0xE,      // 0: OUT
            0x5, 0x5, // 1: LDI 5
            0xF       // 3: HLT
        ];
        computer.ram.loadProgram(program);
        
        // Step 1: OUT
        // T1-T8 (8 ticks)
        for(let i=0; i<8; i++) computer.clockTick();
        
        // PC should be 1
        expect(computer.pc.read()).toBe(1);
        
        // Step 2: LDI 5
        // T1-T8 (8 ticks)
        for(let i=0; i<8; i++) computer.clockTick();
        
        // PC should be 3
        expect(computer.pc.read()).toBe(3);
        expect(computer.a.read()).toBe(5);
    });
});
