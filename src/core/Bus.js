export class Bus {
    constructor() {
        this.value = 0;
        this.listeners = [];
    }

    write(val) {
        this.value = val & 0xF; // Enforce 4-bit width
        this.notify();
    }

    read() {
        return this.value;
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.value));
    }
}
