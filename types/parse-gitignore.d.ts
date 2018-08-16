declare module 'parse-gitignore' {
    type parseGitIgnore = (str: string) => string[];
    const parseGitIgnore: parseGitIgnore;
    export = parseGitIgnore;
}
