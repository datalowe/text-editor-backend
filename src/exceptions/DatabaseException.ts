export function DatabaseException(message: string) {
    this.message = message;
    this.name = 'DatabaseException';
};
