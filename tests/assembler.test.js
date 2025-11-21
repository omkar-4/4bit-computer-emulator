import { describe, expect, it } from 'vitest';
import { Assembler } from '../src/core/Assembler.js';

describe('Assembler', () => {
    const asm = new Assembler();

    it('should assemble simple instructions', () => {
        const code = `
            LDI 5
            OUT
            HLT
        `;
        const bin = asm.assemble(code);
        // LDI 5 -> 5, 5
        // OUT -> E
        // HLT -> F
        expect(bin.slice(0, 4)).toEqual([5, 5, 0xE, 0xF]);
    });

    it('should handle labels', () => {
        const code = `
            start:
            LDI 1
            JMP start
        `;
        const bin = asm.assemble(code);
        // LDI 1 -> 5, 1 (Addr 0, 1)
        // JMP start -> 6, 0 (Addr 2, 3)
        expect(bin.slice(0, 4)).toEqual([5, 1, 6, 0]);
    });

    it('should handle DATA directive', () => {
        const code = `
            LDI 0
            HLT
            count: DATA 9
        `;
        const bin = asm.assemble(code);
        // LDI 0 -> 5, 0
        // HLT -> F
        // DATA 9 -> 9
        expect(bin.slice(0, 4)).toEqual([5, 0, 0xF, 9]);
    });

    it('should throw error for unknown instruction', () => {
        expect(() => asm.assemble('XYZ 1')).toThrow(/Unknown instruction/);
    });
});
