import { describe, expect, it } from 'vitest';
import { ALU } from '../src/core/ALU.js';

describe('ALU', () => {
    it('should add two numbers correctly', () => {
        const alu = new ALU();
        const res = alu.compute(5, 3, false);
        expect(res).toBe(8);
        expect(alu.getFlags().c).toBe(false);
        expect(alu.getFlags().z).toBe(false);
    });

    it('should handle overflow (carry)', () => {
        const alu = new ALU();
        const res = alu.compute(15, 1, false); // 15 + 1 = 16 -> 0
        expect(res).toBe(0);
        expect(alu.getFlags().c).toBe(true);
        expect(alu.getFlags().z).toBe(true);
    });

    it('should subtract correctly', () => {
        const alu = new ALU();
        const res = alu.compute(5, 3, true);
        expect(res).toBe(2);
        expect(alu.getFlags().c).toBe(false);
    });

    it('should handle negative result (borrow)', () => {
        const alu = new ALU();
        const res = alu.compute(3, 5, true); // 3 - 5 = -2 -> 14
        expect(res).toBe(14);
        expect(alu.getFlags().c).toBe(true);
    });
});
