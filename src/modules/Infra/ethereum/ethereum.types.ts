export class SizeExceedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SizeExceedError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
