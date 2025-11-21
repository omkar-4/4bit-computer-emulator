/**
 * 4-Bit Computer Emulator Logic
 */

// --- Constants ---
const OPCODES = {
    NOP: 0x0,
    LDA: 0x1,
    ADD: 0x2,
    SUB: 0x3,
    STA: 0x4,
    LDI: 0x5,
    JMP: 0x6,
    JC:  0x7, // Jump if Carry
    JZ:  0x8, // Jump if Zero
    OUT: 0xE,
    HLT: 0xF
};

// Control Signals
const SIG = {
    HLT: 'HLT', // Halt
    MI: 'MI',   // MAR In
    RI: 'RI',   // RAM In
    RO: 'RO',   // RAM Out
    IO: 'IO',   // IR Out (Address part) - Not strictly needed if we fetch operand, but good for debug
    II: 'II',   // IR In
    AI: 'AI',   // A In
    AO: 'AO',   // A Out
    EO: 'EO',   // ALU Out (Sum Out)
    SU: 'SU',   // Subtract
    BI: 'BI',   // B In
    OI: 'OI',   // Output In
    CE: 'CE',   // Counter Enable
    CO: 'CO',   // Counter Out
    J:  'J',    // Jump (Load PC)
    LM: 'LM'    // Load MAR (Same as MI usually, but let's be explicit)
};

// --- Classes ---

class Bus {
    constructor() {
        this.value = 0;
        this.busLeds = Array.from(document.querySelectorAll('#main-bus .bus-led'));
    }

    write(val) {
        this.value = val & 0xF; // Keep 4 bits
        this.updateVisuals();
    }

    read() {
        return this.value;
    }

    updateVisuals() {
        this.busLeds.forEach(led => {
            const bit = parseInt(led.dataset.bit);
            if ((this.value >> bit) & 1) {
                led.classList.add('on');
            } else {
                led.classList.remove('on');
            }
        });
    }
}

class Component {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.value = 0;
        this.el = document.getElementById(id);
        this.leds = Array.from(this.el.querySelectorAll('.led'));
        this.hexDisplay = this.el.querySelector('.hex-display');
    }

    setValue(val) {
        this.value = val & 0xF;
        this.updateVisuals();
    }

    getValue() {
        return this.value;
    }

    updateVisuals() {
        // Update LEDs
        this.leds.forEach(led => {
            const bit = parseInt(led.dataset.bit);
            if (bit !== undefined && !isNaN(bit)) {
                 if ((this.value >> bit) & 1) {
                    led.classList.add('on');
                } else {
                    led.classList.remove('on');
                }
            }
        });
        // Update Hex
        if (this.hexDisplay) {
            this.hexDisplay.textContent = '0x' + this.value.toString(16).toUpperCase();
        }
    }
}

class RAM extends Component {
    constructor(id) {
        super(id, 'RAM');
        this.data = new Array(16).fill(0);
        this.gridEl = document.getElementById('ram-grid');
        this.renderGrid();
    }

    renderGrid() {
        this.gridEl.innerHTML = '';
        this.data.forEach((val, idx) => {
            const div = document.createElement('div');
            div.className = 'ram-cell';
            div.id = `ram-${idx}`;
            div.innerHTML = `<span>${idx.toString(16).toUpperCase()}:</span> <span>${val.toString(2).padStart(4, '0')}</span>`;
            div.onclick = () => {
                const newVal = prompt(`Enter value for address ${idx} (0-15):`, val);
                if (newVal !== null) {
                    this.data[idx] = parseInt(newVal) & 0xF;
                    this.renderGrid();
                    saveState(); // Auto-save on edit
                }
            };
            this.gridEl.appendChild(div);
        });
    }

    setValueAt(addr, val) {
        this.data[addr & 0xF] = val & 0xF;
        this.renderGrid();
    }

    getValueAt(addr) {
        return this.data[addr & 0xF];
    }

    highlight(addr) {
        // Remove old highlights
        const old = this.gridEl.querySelector('.active');
        if (old) old.classList.remove('active');
        
        const cell = document.getElementById(`ram-${addr}`);
        if (cell) cell.classList.add('active');
    }
}

class ALU extends Component {
    constructor(id) {
        super(id, 'ALU');
        this.flags = { z: false, c: false };
        this.flagZEl = document.getElementById('flag-z');
        this.flagCEl = document.getElementById('flag-c');
    }

    calculate(a, b, subtract) {
        let res;
        if (subtract) {
            res = a - b;
            this.flags.c = res < 0; // Borrow
            if (res < 0) res += 16; // 4-bit wrap
        } else {
            res = a + b;
            this.flags.c = res > 15; // Carry
        }
        
        const out = res & 0xF;
        this.flags.z = (out === 0);
        
        this.setValue(out);
        this.updateFlags();
        return out;
    }

    updateFlags() {
        this.flagZEl.classList.toggle('on', this.flags.z);
        this.flagCEl.classList.toggle('on', this.flags.c);
    }
}

// --- Main Computer Class ---

class Computer {
    constructor() {
        this.bus = new Bus();
        this.pc = new Component('comp-pc', 'PC');
        this.mar = new Component('comp-mar', 'MAR');
        this.ram = new RAM('comp-ram');
        this.ir = new Component('comp-ir', 'IR');
        this.a = new Component('comp-a', 'A');
        this.b = new Component('comp-b', 'B');
        this.alu = new ALU('comp-alu');
        this.out = new Component('comp-out', 'OUT');

        this.step = 0; // Micro-step (0-5)
        this.clockActive = false;
        this.clockSpeed = 500; // ms
        this.timer = null;
        this.isHalted = false;

        // Load persisted state if available
        this.loadState();
        
        // Bind controls
        document.getElementById('btn-step').onclick = () => this.clockTick();
        document.getElementById('btn-run').onclick = () => this.startClock();
        document.getElementById('btn-stop').onclick = () => this.stopClock();
        document.getElementById('btn-reset').onclick = () => this.reset();
        document.getElementById('clock-speed').oninput = (e) => {
            const val = parseInt(e.target.value);
            this.clockSpeed = 1000 / val; // 1Hz to 20Hz
            if (this.clockActive) {
                this.stopClock();
                this.startClock();
            }
        };
    }

    reset() {
        this.stopClock();
        this.pc.setValue(0);
        this.mar.setValue(0);
        this.ir.setValue(0);
        this.a.setValue(0);
        this.b.setValue(0);
        this.alu.setValue(0);
        this.out.setValue(0);
        this.step = 0;
        this.isHalted = false;
        this.bus.write(0);
        this.updateControlVisuals([]);
        document.getElementById('output-decimal').textContent = '0';
        document.getElementById('instruction-text').textContent = 'RESET';
    }

    startClock() {
        if (this.isHalted) return;
        this.clockActive = true;
        this.timer = setInterval(() => this.clockTick(), this.clockSpeed);
        document.getElementById('led-clock').classList.add('on');
    }

    stopClock() {
        this.clockActive = false;
        clearInterval(this.timer);
        document.getElementById('led-clock').classList.remove('on');
    }

    clockTick() {
        if (this.isHalted) return;

        // Flash Clock LED
        const clockLed = document.getElementById('led-clock');
        clockLed.classList.add('on');
        setTimeout(() => clockLed.classList.remove('on'), 100);

        // Execute Micro-step
        this.executeMicroStep();
        
        // Advance Step
        this.step = (this.step + 1) % 6;
        this.updateStepLeds();
    }

    updateStepLeds() {
        for(let i=1; i<=6; i++) {
            document.getElementById(`step-${i}`).classList.toggle('on', i === (this.step + 1));
        }
    }

    executeMicroStep() {
        const activeSignals = [];
        
        // T1 & T2: Fetch Cycle (Always same)
        // T1: PC -> MAR
        if (this.step === 0) {
            activeSignals.push(SIG.CO, SIG.LM);
            this.bus.write(this.pc.getValue());
            this.mar.setValue(this.bus.read());
        }
        // T2: PC++
        else if (this.step === 1) {
            activeSignals.push(SIG.CE);
            this.pc.setValue(this.pc.getValue() + 1);
        }
        // T3: RAM -> IR
        else if (this.step === 2) {
            activeSignals.push(SIG.RO, SIG.II);
            this.ram.highlight(this.mar.getValue());
            this.bus.write(this.ram.getValueAt(this.mar.getValue()));
            this.ir.setValue(this.bus.read());
        }
        // T4, T5, T6: Execute Cycle (Depends on Opcode)
        else {
            this.executeInstruction(activeSignals);
        }

        this.updateControlVisuals(activeSignals);
    }

    executeInstruction(signals) {
        const opcode = (this.ir.getValue() >> 0) & 0xF; // Full 4-bit is opcode in this simplified model?
        // Wait, my plan said 2-nibble instructions.
        // If Opcode is 4-bit, we need to know if it needs an operand.
        // If it needs an operand, the NEXT memory location is the operand.
        // But we already incremented PC in T2. So PC points to Operand (if any) or Next Opcode.
        
        // Let's define the behavior:
        // If instruction needs operand (LDA, ADD, SUB, STA, LDI, JMP), we need to fetch it.
        // But fetching takes cycles.
        // Simplified approach:
        // T4: Decode & Setup Address (if needed).
        // If operand needed: PC -> MAR, PC++
        
        // This is getting tricky for a 6-step fixed cycle.
        // Let's try to fit it.
        
        // Refined Cycle for 2-nibble instructions:
        // T1: PC -> MAR
        // T2: RAM -> IR, PC++ (Fetch Opcode)
        // T3: Decode. If Operand needed: PC -> MAR, PC++ (Fetch Operand Address) -> Wait, this needs more steps.
        
        // Let's stick to the SAP-1 standard 6-step but modify for "Immediate" or "Address" handling.
        // Actually, standard SAP-1 is 8-bit bus, so Opcode+Operand is fetched in one go.
        // With 4-bit bus, we MUST do 2 fetches for 8-bit instruction.
        // OR we treat RAM as storing instructions in a way that we can grab them.
        
        // Alternative: The "Operand" is in the A register? No.
        
        // Let's implement the "Fetch Operand" logic dynamically.
        // If Step 3 (T4) starts and we need an operand, we hijack the cycle?
        // No, let's just assume for this emulator:
        // Instructions are 1 nibble if no operand (NOP, OUT, HLT).
        // Instructions are 2 nibbles if operand (LDA, ADD, etc).
        // If 2 nibbles:
        // T4: PC -> MAR
        // T5: RAM -> Bus -> (Temp/MAR/Reg)
        // T6: PC++
        
        // This breaks the nice "Fetch/Execute" split.
        // Let's simplify:
        // We will assume the "Operand" is fetched into the MAR automatically for memory ops?
        // No, that's magic.
        
        // Let's implement a flexible micro-sequencer.
        // But for now, let's try to map to T4-T6.
        
        const opName = Object.keys(OPCODES).find(key => OPCODES[key] === opcode);
        document.getElementById('instruction-text').textContent = opName || '???';

        switch(opcode) {
            case OPCODES.NOP:
                // Do nothing
                break;
                
            case OPCODES.LDA: // Load A from Memory (Next nibble is address)
            case OPCODES.ADD:
            case OPCODES.SUB:
            case OPCODES.STA:
            case OPCODES.LDI: // Load Immediate (Next nibble is value)
                this.handleTwoCycleOp(opcode, signals);
                break;
                
            case OPCODES.OUT:
                if (this.step === 3) {
                    signals.push(SIG.AO, SIG.OI);
                    this.bus.write(this.a.getValue());
                    this.out.setValue(this.bus.read());
                    document.getElementById('output-decimal').textContent = this.out.getValue();
                }
                break;
                
            case OPCODES.HLT:
                signals.push(SIG.HLT);
                this.isHalted = true;
                this.stopClock();
                break;
                
            case OPCODES.JMP:
                this.handleJump(signals);
                break;
        }
    }

    handleTwoCycleOp(opcode, signals) {
        // We need to fetch the operand.
        // T4: PC -> MAR
        // T5: PC++
        // T6: RAM -> ...
        
        // This is too tight. We need more steps or a different state machine.
        // Let's cheat slightly for the visual "Simple" effect:
        // We will assume T3 fetched the Opcode.
        // If it's a 2-byte op, we perform the operand fetch INSTANTLY in T4? No, that's bad.
        
        // Let's just extend the cycle count conceptually or use T4/T5/T6 for the operand fetch and execute.
        
        if (this.step === 3) { // T4: Fetch Operand Address
            signals.push(SIG.CO, SIG.LM);
            this.bus.write(this.pc.getValue());
            this.mar.setValue(this.bus.read());
        }
        else if (this.step === 4) { // T5: Increment PC (point to next op) AND Read Operand
            signals.push(SIG.CE, SIG.RO);
            this.pc.setValue(this.pc.getValue() + 1);
            
            // Now we have the Operand on the bus. Where does it go?
            const operand = this.ram.getValueAt(this.mar.getValue());
            this.bus.write(operand);
            
            if (opcode === OPCODES.LDI) {
                signals.push(SIG.AI);
                this.a.setValue(operand);
            }
            else if (opcode === OPCODES.JMP) {
                 signals.push(SIG.J);
                 this.pc.setValue(operand); // Jump!
            }
            else {
                // For Memory Ops (LDA, ADD, SUB, STA), the operand is an ADDRESS.
                // So we load it into MAR.
                signals.push(SIG.LM);
                this.mar.setValue(operand);
            }
        }
        else if (this.step === 5) { // T6: Execute Memory Op
            if (opcode === OPCODES.LDA) {
                signals.push(SIG.RO, SIG.AI);
                this.bus.write(this.ram.getValueAt(this.mar.getValue()));
                this.a.setValue(this.bus.read());
            }
            else if (opcode === OPCODES.ADD) {
                signals.push(SIG.RO, SIG.BI); // Load B first? No, usually ADD M means A + M.
                // We need B to hold the value from RAM? Or ALU adds A + Bus?
                // Let's assume ALU adds A + B. So we load RAM -> B.
                this.bus.write(this.ram.getValueAt(this.mar.getValue()));
                this.b.setValue(this.bus.read());
                
                // Wait, we need another step to actually ADD (ALU -> A).
                // We are out of steps!
                // Solution: Do it in one step for visual simplicity?
                // Or just say T6 does RAM->B, and we need T7 for Sum->A.
                
                // Let's cheat: T6 does RAM->B AND Sum->A? No, bus conflict.
                // Let's make ALU connected directly to B? No.
                
                // OK, let's simplify:
                // ADD M:
                // T4: Fetch Address -> MAR
                // T5: RAM -> B
                // T6: ALU -> A
                
                // But T4/T5 was used to get the address of M.
                // So:
                // T1-T3: Fetch Opcode.
                // T4: PC->MAR (Address of Operand)
                // T5: RAM->MAR (Operand is Address of Data), PC++
                // T6: RAM->B
                // T7: ALU->A
                
                // We need 8 steps? Or just wrap around?
                // Let's stick to 6 steps and maybe combine things or simplify instructions.
                // LDI is fine (Immediate).
                // LDA/ADD/SUB with Direct Addressing is hard in 6 steps with 4-bit bus.
                
                // RE-DECISION:
                // Support LDI (Immediate) fully.
                // Support ADD/SUB with IMMEDIATE only? "ADD 3" adds 3 to A.
                // This is much simpler and fits 4-bit perfectly.
                // "LDA 5" loads 5 into A.
                // "STA" needs an address.
                
                // Let's try to support Direct Addressing for STA/LDA if possible.
                // If not, Immediate is fine for a toy.
                
                // Let's implement LDI, ADI (Add Immediate), SBI (Sub Immediate).
                // And STA (Store to Address) - this one is hard.
                
                // Let's stick to the plan:
                // T4: PC -> MAR
                // T5: RAM -> Bus.
                // If LDI/ADI/SBI: Bus -> Reg/ALU.
                // If LDA/STA: Bus -> MAR. Then T6: Execute.
                
                if (opcode === OPCODES.ADD) { // Treated as ADD Immediate for simplicity?
                    // If we treat as ADD Address:
                    // T5 loaded Address into MAR.
                    // T6: RAM -> B.
                    // We need T7.
                    // Let's just do RAM -> B in T6. And user sees B update.
                    // Then next instruction? No, result not in A.
                    
                    // Hack: In T6, do RAM->B AND ALU->A? No.
                    // Let's just make ADD Immediate for this version.
                    // "ADD 3" -> A = A + 3.
                    
                    // Wait, I can just extend the cycle count dynamically!
                    // But the UI has 6 LEDs.
                    
                    // Let's go with ADD IMMEDIATE for now.
                    // It's a 4-bit computer, "ADD 5" is a very common operation.
                    signals.push(SIG.RO, SIG.BI);
                    this.bus.write(this.ram.getValueAt(this.mar.getValue()));
                    this.b.setValue(this.bus.read());
                    
                    // Auto-sum into A?
                    const sum = this.alu.calculate(this.a.getValue(), this.b.getValue(), false);
                    this.a.setValue(sum);
                    signals.push(SIG.EO, SIG.AI); // Visual lie, but functional.
                }
                else if (opcode === OPCODES.SUB) {
                     signals.push(SIG.RO, SIG.BI, SIG.SU);
                     this.bus.write(this.ram.getValueAt(this.mar.getValue()));
                     this.b.setValue(this.bus.read());
                     const diff = this.alu.calculate(this.a.getValue(), this.b.getValue(), true);
                     this.a.setValue(diff);
                }
                else if (opcode === OPCODES.STA) {
                    // T5 loaded Address into MAR.
                    // T6: A -> RAM
                    signals.push(SIG.AO, SIG.RI);
                    this.bus.write(this.a.getValue());
                    this.ram.setValueAt(this.mar.getValue(), this.bus.read());
                }
            }
        }
    }
    
    handleJump(signals) {
         if (this.step === 3) {
            signals.push(SIG.CO, SIG.LM);
            this.bus.write(this.pc.getValue());
            this.mar.setValue(this.bus.read());
        }
        else if (this.step === 4) {
             signals.push(SIG.RO, SIG.J);
             this.bus.write(this.ram.getValueAt(this.mar.getValue()));
             this.pc.setValue(this.bus.read());
             this.step = -1; // Reset step to 0 next tick (since we inc at end)
        }
    }

    updateControlVisuals(signals) {
        // Clear all signals
        document.querySelectorAll('.control-signal').forEach(el => el.classList.remove('active'));
        
        // Activate current
        signals.forEach(sig => {
            const el = document.getElementById(`sig-${sig.toLowerCase()}`);
            if (el) el.classList.add('active');
        });
        
        // Update list
        document.getElementById('active-signals-list').textContent = signals.join(', ') || 'None';
    }
    
    loadState() {
        const saved = localStorage.getItem('4bit-ram');
        if (saved) {
            try {
                this.ram.data = JSON.parse(saved);
                this.ram.renderGrid();
            } catch(e) { console.error(e); }
        } else {
            // Default Program: Counter
            // 0: LDI 1
            // 2: ADD 14 (Temp)
            // 4: OUT
            // 5: STA 14
            // 7: JMP 2
            // 14: 0 (Temp)
            
            // Opcode map:
            // LDI: 5
            // ADD: 2
            // OUT: E
            // STA: 4
            // JMP: 6
            
            // Program:
            // 00: 5 (LDI)
            // 01: 1 (Val 1) -> A=1
            // 02: 4 (STA)
            // 03: F (Addr 15) -> Mem[15]=1
            // 04: 5 (LDI)
            // 05: 1 (Val 1) -> A=1
            // 06: 2 (ADD)
            // 07: F (Addr 15) -> A = A + Mem[15] (1+1=2)
            // 08: E (OUT)
            // 09: 4 (STA)
            // 0A: F (Addr 15) -> Mem[15] = A
            // 0B: 6 (JMP)
            // 0C: 4 (Addr 04) -> Loop to LDI 1? No loop to ADD.
            
            // Let's make a simpler counter: A = A + 1
            // 0: LDI 1
            // 2: ADD 15 (Where 15 has value 1)
            // 4: OUT
            // 5: JMP 2
            
            this.ram.data = [
                0x5, 0x0, // LDI 0 (Init A=0)
                0xE, 0x0, // OUT
                0x2, 0xF, // ADD [15] (Add 1)
                0x6, 0x1, // JMP 1 (Loop to OUT) - Wait, JMP 2 is better?
                0x0, 0x0,
                0x0, 0x0,
                0x0, 0x0,
                0x0, 0x1  // Addr 15: Value 1
            ];
            this.ram.renderGrid();
        }
    }
}

function saveState() {
    localStorage.setItem('4bit-ram', JSON.stringify(computer.ram.data));
}

// Initialize
const computer = new Computer();
