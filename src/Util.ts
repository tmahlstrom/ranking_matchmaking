export class Util {
    public static getRandomInteger(min, max) {
        return Math.floor(Math.random() * (max - min) + min);
    }
    public static getRandomArbitrary(min, max) {
        return Math.random() * (max - min) + min;
    }
}