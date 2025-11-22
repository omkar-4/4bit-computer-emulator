import { beforeEach, describe, expect, it } from 'vitest';
import { Computer } from '../src/core/Computer.js';

describe('Emulator Stress Test Suite', () => {
    let computer;

    beforeEach(() => {
        computer = new Computer();
        computer.reset();
    });

    // Program 1: Looping Counter (0-15)
    it('should run Program 1: Looping Counter', () => {
        const program = [
            0x5, 0x0, // 0: LDI 0
            0xE,      // 2: OUT
            0x2, 0xA, // 3: ADD A
            0x6, 0x2, // 5: JMP 2
            0x0, 0x0, 0x0, // 7, 8, 9: Pad
            0x1       // A: Data 1
        ];
        computer.ram.loadProgram(program);

        // 0 (20 ticks: LDI(8) + OUT(8) + ADD(4/8))
        for(let i=0; i<20; i++) computer.clockTick();
        expect(computer.a.read()).toBe(0);
        
        // 1 (Run 5 more ticks. Total 25. ADD finishes at 24.)
        for(let i=0; i<5; i++) computer.clockTick();
        expect(computer.a.read()).toBe(1);

        // Wrap check
        for(let i=0; i<300; i++) computer.clockTick();
        expect(computer.a.read()).toBeGreaterThanOrEqual(0);
        expect(computer.a.read()).toBeLessThan(16);
    });

    // Program 2: Compact Fibonacci
    it('should run Program 2: Compact Fibonacci', () => {
        const program = [
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
        computer.ram.loadProgram(program);

        const runLoop = () => { for(let i=0; i<56; i++) computer.clockTick(); };

        runLoop(); expect(computer.out.read()).toBe(1);
        runLoop(); expect(computer.out.read()).toBe(1);
        runLoop(); expect(computer.out.read()).toBe(2);
        runLoop(); expect(computer.out.read()).toBe(3);
        runLoop(); expect(computer.out.read()).toBe(5);
        runLoop(); expect(computer.out.read()).toBe(8);
        runLoop(); expect(computer.out.read()).toBe(13);
        runLoop(); expect(computer.out.read()).toBe(5);
    });

    // Program 3: Double (Left Shift)
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

        for(let i=0; i<100; i++) computer.clockTick();
        
        expect(computer.isHalted).toBe(true);
        expect(computer.out.read()).toBe(6);
        expect(computer.ram.read(0xA)).toBe(6);
    });

    // Program 4: Max of Two Numbers
    it('should run Program 4: Max(5, 9)', () => {
        const program = [
            0x1, 0xE, // 0: LDA E
            0x3, 0xF, // 2: SUB F
            0x7, 0xA, // 4: JC A
            0x1, 0xE, // 6: LDA E
            0x6, 0xC, // 8: JMP C
            0x1, 0xF, // A: LDA F
            0xE,      // C: OUT
            0xF,      // D: HLT
            0x5,      // E: 5
            0x9       // F: 9
        ];
        
        computer.ram.loadProgram(program);
        
        for(let i=0; i<100; i++) computer.clockTick();
        
        expect(computer.isHalted).toBe(true);
        expect(computer.out.read()).toBe(9);
    });

    it('should run Program 4: Max(12, 3)', () => {
        const program = [
            0x1, 0xE, // 0: LDA E
            0x3, 0xF, // 2: SUB F
            0x7, 0xA, // 4: JC A
            0x1, 0xE, // 6: LDA E
            0x6, 0xC, // 8: JMP C
            0x1, 0xF, // A: LDA F
            0xE,      // C: OUT
            0xF,      // D: HLT
            0xC,      // E: 12
            0x3       // F: 3
        ];
        
        computer.ram.loadProgram(program);
        
        for(let i=0; i<100; i++) computer.clockTick();
        
        expect(computer.isHalted).toBe(true);
        expect(computer.out.read()).toBe(12);
    });
});
