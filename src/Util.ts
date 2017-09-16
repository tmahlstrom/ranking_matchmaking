export class Util {
    public static getRandomArbitrary(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
}