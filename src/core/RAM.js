export class RAM {
    constructor(size = 16) {
        this.data = new Array(size).fill(0);
        this.listeners = [];
    }

    write(addr, val) {
        this.data[addr & 0xF] = val & 0xF;
        this.notify(addr);
    }

    read(addr) {
        return this.data[addr & 0xF];
    }

    loadProgram(program) {
        program.forEach((val, idx) => {
            if (idx < this.data.length) {
                this.data[idx] = val & 0xF;
            }
        });
        this.notifyAll();
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify(addr) {
        this.listeners.forEach(cb => cb(this.data, addr));
    }

    notifyAll() {
        this.listeners.forEach(cb => cb(this.data, null));
    }
}
