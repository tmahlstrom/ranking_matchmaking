import { PersistentBase } from "./PersistentBase";

export class AccountMatchmaking extends PersistentBase {

    // variables starting with _ are stored persistently after calling .store();
    // variables without _ are stored until the server restarts (not saved in the database)

    private _value1: string;
    private _value2: number;

    //Keep the className forwarding for server integration
    constructor(className?: string) {
        super(className)
        //initial values are important for new models
        this.value1 = ''
        this.value2 = 0;
    }

    public get value1(): string {
        return this._value1;
    }

    public set value1(value: string) {
        this._value1 = value;
    }

    public get value2(): number {
        return this._value2;
    }

    public set value2(value: number) {
        this._value2 = value;
    }
}