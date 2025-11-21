import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Counter Loop', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    it('should wrap around from 15 to 0', () => {
        computer.ram.loadProgram([
            0x5, 0xF, // 0: LDI 15
            0x2, 0x6, // 2: ADD 6
            0xF,      // 4: HLT
            0x0,      // 5: Pad
            0x1       // 6: Data 1
        ]);

        // Run LDI 15
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.a.read()).toBe(15);

        // Run ADD 6
        for(let i=0; i<8; i++) computer.clockTick();
        expect(computer.a.read()).toBe(0);
        expect(computer.alu.getFlags().c).toBe(true);
    });
});
