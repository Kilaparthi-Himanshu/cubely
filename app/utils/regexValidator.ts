export function isValidInstanceName(regex: RegExp, name: string) {
    return regex.test(name);
}
