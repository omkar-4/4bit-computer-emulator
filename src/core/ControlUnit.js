import { OPCODES, SIG } from './constants.js';

export class ControlUnit {
    constructor() {
        this.step = 0;
        this.signals = [];
    }

    reset() {
        this.step = 0;
        this.signals = [];
    }

    getMicroInstructions(opcode, step, flags = { z: false, c: false }) {
        const signals = [];

        // T1: Fetch Address (PC -> MAR)
        if (step === 0) {
            signals.push(SIG.CO, SIG.LM);
        }
        // T2: Increment PC
        else if (step === 1) {
            signals.push(SIG.CE);
        }
        // T3: Fetch Opcode (RAM -> IR)
        else if (step === 2) {
            signals.push(SIG.RO, SIG.II);
        }
        // Execute Cycle (T4-T8)
        else {
            this.decode(opcode, step, signals, flags);
        }

        return signals;
    }

    decode(opcode, step, signals, flags) {
        switch(opcode) {
            case OPCODES.NOP:
                break;
            case OPCODES.LDA:
            case OPCODES.ADD:
            case OPCODES.SUB:
            case OPCODES.STA:
            case OPCODES.LDI:
            case OPCODES.JMP:
            case OPCODES.JC:
            case OPCODES.JZ:
                this.handleTwoCycleOp(opcode, step, signals, flags);
                break;
            case OPCODES.OUT:
                if (step === 3) signals.push(SIG.AO, SIG.OI);
                break;
            case OPCODES.HLT:
                signals.push(SIG.HLT);
                break;
        }
    }

    handleTwoCycleOp(opcode, step, signals, flags) {
        // T4: Fetch Operand Address (PC -> MAR)
        if (step === 3) {
            signals.push(SIG.CO, SIG.LM);
        }
        // T5: Increment PC (point to next op) AND Read Operand
        else if (step === 4) {
            // Default: Read Operand + Increment PC (Prepare for next instruction)
            // But for Jumps, we might NOT want to increment if we jump.
            
            let doJump = false;
            if (opcode === OPCODES.JMP) doJump = true;
            else if (opcode === OPCODES.JC && flags.c) doJump = true;
            else if (opcode === OPCODES.JZ && flags.z) doJump = true;

            if (doJump) {
                // Jump: Load Bus (Operand) into PC. DO NOT Increment PC.
                signals.push(SIG.RO, SIG.J);
            } else {
                // No Jump (or other op): Read Operand + Increment PC
                signals.push(SIG.RO, SIG.CE);
                
                // Destination for non-jumps
                if (opcode === OPCODES.LDI) signals.push(SIG.AI);
                else if (opcode === OPCODES.JMP || opcode === OPCODES.JC || opcode === OPCODES.JZ) {
                    // If we didn't jump, we just consumed the operand (address) and ignored it.
                    // PC is incremented to skip it.
                }
                else signals.push(SIG.LM); // For Memory Ops, operand is address
            }
        }
        // T6: Execute Memory Op (Read Data)
        else if (step === 5) {
            if (opcode === OPCODES.LDA) signals.push(SIG.RO, SIG.AI);
            else if (opcode === OPCODES.ADD) signals.push(SIG.RO, SIG.BI); // Load B
            else if (opcode === OPCODES.SUB) signals.push(SIG.RO, SIG.BI, SIG.SU); // Load B & Sub
            else if (opcode === OPCODES.STA) signals.push(SIG.AO, SIG.RI);
        }
        // T7: ALU Operation (Sum/Diff -> A)
        else if (step === 6) {
             if (opcode === OPCODES.ADD) signals.push(SIG.EO, SIG.AI);
             else if (opcode === OPCODES.SUB) signals.push(SIG.EO, SIG.AI, SIG.SU);
        }
    }
}
