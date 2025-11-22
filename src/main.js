import { Assembler } from './core/Assembler.js';
import { Computer } from './core/Computer.js';
import './style.css';

const computer = new Computer();
const assembler = new Assembler();

// --- UI Helpers ---
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function updateLeds(id, value) {
    const el = $(id);
    if (!el) return;
    const leds = el.querySelectorAll('.led');
    leds.forEach(led => {
        const bit = parseInt(led.dataset.bit);
        if (!isNaN(bit)) {
            if ((value >> bit) & 1) led.classList.add('on');
            else led.classList.remove('on');
        }
    });
    const hex = el.querySelector('.hex-display');
    if (hex) hex.textContent = '0x' + value.toString(16).toUpperCase();
}

function updateBus(value) {
    $$('#main-bus .bus-led').forEach(led => {
        const bit = parseInt(led.dataset.bit);
        if ((value >> bit) & 1) led.classList.add('on');
        else led.classList.remove('on');
    });
}

function renderRam() {
    const grid = $('ram-grid');
    grid.innerHTML = '';
    computer.ram.data.forEach((val, idx) => {
        const div = document.createElement('div');
        div.className = 'ram-cell';
        if (idx === computer.mar.read()) div.classList.add('selected'); // Highlight MAR address
        div.innerHTML = `<span>${idx.toString(16).toUpperCase()}:</span> <span>${val.toString(2).padStart(4, '0')}</span>`;
        div.onclick = () => {
            const newVal = prompt(`Enter value for address ${idx} (0-15):`, val);
            if (newVal !== null) {
                computer.ram.write(idx, parseInt(newVal));
                renderRam();
            }
        };
        grid.appendChild(div);
    });
}

function updateControlSignals(signals) {
    $$('.control-signal').forEach(el => el.classList.remove('active'));
    signals.forEach(sig => {
        const el = $(`sig-${sig.toLowerCase()}`);
        if (el) el.classList.add('active');
    });
    $('active-signals-list').textContent = signals.join(', ') || 'None';
    
    // Update Step LEDs
    for(let i=1; i<=8; i++) {
        const stepLed = $(`step-${i}`);
        if(stepLed) stepLed.classList.toggle('on', i === (computer.step + 1));
    }
}

function updateUI() {
    updateLeds('comp-pc', computer.pc.read());
    updateLeds('comp-mar', computer.mar.read());
    updateLeds('comp-ir', computer.ir.read());
    updateLeds('comp-a', computer.a.read());
    updateLeds('comp-b', computer.b.read());
    updateLeds('comp-alu', computer.alu.result); // Show last result
    updateLeds('comp-out', computer.out.read());
    $('output-decimal').textContent = computer.out.read();
    
    // Flags
    const flags = computer.alu.getFlags();
    $('flag-z').classList.toggle('on', flags.z);
    $('flag-c').classList.toggle('on', flags.c);

    updateBus(computer.bus.read());
    updateControlSignals(computer.activeSignals);
    
    // Highlight RAM row based on MAR?
    // Actually renderRam handles it, but we need to re-render or toggle class
    // Optimization: just toggle class
    $$('.ram-cell').forEach((el, idx) => {
        el.classList.toggle('selected', idx === computer.mar.read());
    });
}

// --- Event Listeners ---
$('btn-step').onclick = () => {
    computer.clockTick();
    updateUI();
};

$('btn-reset').onclick = () => {
    computer.reset();
    updateUI();
    renderRam();
};

let timer = null;
$('btn-run').onclick = () => {
    if (timer) return;
    const speed = 1000 / parseInt($('clock-speed').value);
    timer = setInterval(() => {
        if (computer.isHalted) {
            clearInterval(timer);
            timer = null;
            return;
        }
        computer.clockTick();
        updateUI();
    }, speed);
};

$('btn-stop').onclick = () => {
    clearInterval(timer);
    timer = null;
};

$('clock-speed').oninput = (e) => {
    if (timer) {
        clearInterval(timer);
        const speed = 1000 / parseInt(e.target.value);
        timer = setInterval(() => {
             if (computer.isHalted) {
                clearInterval(timer);
                timer = null;
                return;
            }
            computer.clockTick();
            updateUI();
        }, speed);
    }
};

$('btn-assemble').onclick = () => {
    const source = $('assembly-editor').value;
    const statusEl = $('assembler-status');
    
    try {
        const machineCode = assembler.assemble(source);
        computer.reset();
        computer.ram.loadProgram(machineCode);
        renderRam();
        updateUI();
        
        statusEl.textContent = "Assembled & Loaded Successfully!";
        statusEl.className = "status-bar success";
    } catch (e) {
        statusEl.textContent = "Error: " + e.message;
        statusEl.className = "status-bar error";
    }
};

// --- Init ---
// Initial Assemble with Looping Counter
$('assembly-editor').value = `// Looping Counter (0-15)
init:
  LDI 0    // Start at 0
loop:
  OUT      // Display A
  ADD inc  // Add 1
  JMP loop // Repeat

inc:
  DATA 1`;

const EXAMPLES = {
    counter: `// Looping Counter (0-15)
init:
  LDI 0      // Start at 0
loop:
  OUT        // Display
  ADD inc    // Add 1
  JMP loop   // Repeat

inc:
  DATA 1`,

    fib: `// Fibonacci (Compact)
// 1, 1, 2, 3, 5, 8, 13...
loop:
  LDA curr   // Load curr
  OUT        // Display
  ADD prev   // A = curr + prev
  STA curr   // curr = new sum
  SUB prev   // A = new sum - prev (old curr)
  STA prev   // prev = old curr
  JMP loop   // Repeat

prev: DATA 0
curr: DATA 1`,

    swap: `// Swap Two Values
start:
  LDA varA   // Load Value A
  STA temp   // Store in Temp
  LDA varB   // Load Value B
  STA varA   // Store in A
  LDA temp   // Load Temp (Original A)
  STA varB   // Store in B
  HLT        // Stop

varA: DATA 5
varB: DATA 9
temp: DATA 0`,

    double: `// Double Value (Left Shift)
start:
  LDA val    // Load value
  ADD val    // Add to itself (x + x = 2x)
  STA val    // Store result
  OUT        // Display
  HLT

val: DATA 3  // Input (3 -> 6)`,

    max: `// Max of Two Numbers
start:
  LDA A      // Load A
  SUB B      // A - B
  JC is_b    // If Carry (Borrow), A < B
  LDA A      // Else A >= B, Load A
  JMP out    // Go to output
is_b:
  LDA B      // Load B
out:
  OUT        // Display Max
  HLT

A: DATA 5
B: DATA 9`,

    rotate: `// Rotate Left (Pattern)
// 1, 2, 4, 8, 1, 2...
start:
  LDA val    // Load Value
  ADD val    // Shift Left (x2)
  JC wrap    // If Carry (16), wrap to 1
  JMP save   // Else save
wrap:
  ADD 0      // Add [0] (Opcode 1 = 1)
save:
  STA val    // Store
  OUT        // Display
  JMP start  // Repeat

val: DATA 1`,

    sum: `// Sum Array
// Sums 3, 4, 5 -> 12
start:
  LDA n1     // Load 1st
  ADD n2     // Add 2nd
  ADD n3     // Add 3rd
  OUT        // Display Sum
  HLT

n1: DATA 3
n2: DATA 4
n3: DATA 5`
};

$('example-selector').onchange = (e) => {
    const key = e.target.value;
    if (EXAMPLES[key]) {
        $('assembly-editor').value = EXAMPLES[key];
        // Optional: Auto-assemble
        $('btn-assemble').click();
    }
    // Reset selector so you can select the same one again if needed
    e.target.value = "";
};

$('btn-assemble').click();
