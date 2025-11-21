export class Register {
    constructor(name) {
        this.name = name;
        this.value = 0;
        this.listeners = [];
    }

    load(val) {
        this.value = val & 0xF;
        this.notify();
    }

    read() {
        return this.value;
    }

    increment() {
        this.value = (this.value + 1) & 0xF;
        this.notify();
    }

    subscribe(callback) {
        this.listeners.push(callback);
    }

    notify() {
        this.listeners.forEach(cb => cb(this.value));
    }
}
