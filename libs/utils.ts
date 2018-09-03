export function camalCaseToDashed(camalCase: string): string {
    return camalCase.replace(/[A-Z]/g, function( $ ){
        return '-' + $.toLowerCase();
    });
}
