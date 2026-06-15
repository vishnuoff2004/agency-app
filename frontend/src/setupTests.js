import '@testing-library/jest-dom';

global.IntersectionObserver = class {
  constructor() { this.observe = jest.fn(); this.unobserve = jest.fn(); this.disconnect = jest.fn(); }
  observe() { return null; }
  unobserve() { return null; }
  disconnect() { return null; }
};

window.scrollTo = jest.fn();

