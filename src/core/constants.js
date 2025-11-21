export const OPCODES = {
    NOP: 0x0,
    LDA: 0x1,
    ADD: 0x2,
    SUB: 0x3,
    STA: 0x4,
    LDI: 0x5,
    JMP: 0x6,
    JC:  0x7,
    JZ:  0x8,
    OUT: 0xE,
    HLT: 0xF
};

export const SIG = {
    HLT: 'HLT', // Halt
    MI: 'MI',   // MAR In
    RI: 'RI',   // RAM In
    RO: 'RO',   // RAM Out
    IO: 'IO',   // IR Out
    II: 'II',   // IR In
    AI: 'AI',   // A In
    AO: 'AO',   // A Out
    EO: 'EO',   // ALU Out
    SU: 'SU',   // Subtract Mode
    BI: 'BI',   // B In
    OI: 'OI',   // Output In
    CE: 'CE',   // Counter Enable
    CO: 'CO',   // Counter Out
    J:  'J',    // Jump
    LM: 'LM'    // Load MAR
};
