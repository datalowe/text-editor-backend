export function InvalidTokenException(message: string) {
    this.message = message;
    this.name = 'InvalidTokenException';
};
