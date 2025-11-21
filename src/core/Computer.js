import { ALU } from './ALU.js';
import { Bus } from './Bus.js';
import { ControlUnit } from './ControlUnit.js';
import { RAM } from './RAM.js';
import { Register } from './Register.js';
import { SIG } from './constants.js';

export class Computer {
    constructor() {
        this.bus = new Bus();
        this.pc = new Register('PC');
        this.mar = new Register('MAR');
        this.ir = new Register('IR');
        this.a = new Register('A');
        this.b = new Register('B');
        this.out = new Register('OUT');
        this.ram = new RAM();
        this.alu = new ALU();
        this.cu = new ControlUnit();
        
        this.step = 0;
        this.isHalted = false;
        this.activeSignals = [];
    }

    reset() {
        this.pc.load(0);
        this.mar.load(0);
        this.ir.load(0);
        this.a.load(0);
        this.b.load(0);
        this.out.load(0);
        this.step = 0;
        this.isHalted = false;
        this.activeSignals = [];
        this.bus.write(0);
    }

    clockTick() {
        if (this.isHalted) return;

        // Get signals for current step
        const opcode = this.ir.read();
        const flags = this.alu.getFlags();
        this.activeSignals = this.cu.getMicroInstructions(opcode, this.step, flags);

        // Execute signals
        this.executeSignals(this.activeSignals);

        // Advance step
        this.step = (this.step + 1) % 8;
    }

    executeSignals(signals) {
        // 1. Output to Bus (Only one should be active)
        if (signals.includes(SIG.CO)) this.bus.write(this.pc.read());
        else if (signals.includes(SIG.RO)) this.bus.write(this.ram.read(this.mar.read()));
        else if (signals.includes(SIG.IO)) this.bus.write(this.ir.read() & 0xF); // Lower nibble
        else if (signals.includes(SIG.AO)) this.bus.write(this.a.read());
        else if (signals.includes(SIG.EO)) {
            const subtract = signals.includes(SIG.SU);
            const res = this.alu.compute(this.a.read(), this.b.read(), subtract);
            this.bus.write(res);
        }

        // 2. Input from Bus
        const busVal = this.bus.read();
        if (signals.includes(SIG.LM)) this.mar.load(busVal);
        if (signals.includes(SIG.II)) this.ir.load(busVal);
        if (signals.includes(SIG.AI)) this.a.load(busVal);
        if (signals.includes(SIG.BI)) this.b.load(busVal);
        if (signals.includes(SIG.OI)) this.out.load(busVal);
        if (signals.includes(SIG.RI)) this.ram.write(this.mar.read(), busVal);
        if (signals.includes(SIG.J))  this.pc.load(busVal);

        // 3. Special
        if (signals.includes(SIG.CE)) this.pc.increment();
        if (signals.includes(SIG.HLT)) this.isHalted = true;
    }
}
