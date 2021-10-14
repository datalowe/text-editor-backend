export function IncorrectPasswordException(message: string) {
    this.message = message;
    this.name = 'IncorrectPasswordException';
};
