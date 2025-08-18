// Global type declarations

// Node.js types for browser environment
declare namespace NodeJS {
  interface Timeout {
    ref(): this;
    unref(): this;
  }
}
