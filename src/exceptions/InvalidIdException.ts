export function InvalidIdException(message: string) {
    this.message = message;
    this.name = 'InvalidIdException';
};
