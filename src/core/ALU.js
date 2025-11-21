export class ALU {
    constructor() {
        this.flags = { z: false, c: false };
        this.result = 0;
    }

    compute(a, b, subtract = false) {
        let res;
        if (subtract) {
            res = a - b;
            this.flags.c = res < 0; // Borrow
            if (res < 0) res += 16;
        } else {
            res = a + b;
            this.flags.c = res > 15; // Carry
        }

        this.result = res & 0xF;
        this.flags.z = (this.result === 0);
        
        return this.result;
    }

    getFlags() {
        return { ...this.flags };
    }
}
