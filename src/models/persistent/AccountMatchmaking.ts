import { PersistentBase } from "./PersistentBase";

export class AccountMatchmaking extends PersistentBase {

    // variables starting with _ are stored persistently after calling .store();
    // variables without _ are stored until the server restarts (not saved in the database)

    private _username: string;

    private _humRating: number;
    private _humRatingUncertainty: number;
    private _humRatingVolatility: number;

    private _orcRating: number;
    private _orcRatingUncertainty: number;
    private _orcRatingVolatility: number;

    private _elfRating: number;
    private _elfRatingUncertainty: number;
    private _elfRatingVolatility: number;

    private _undRating: number;
    private _undRatingUncertainty: number;
    private _undRatingVolatility: number;

    private _rndRating: number;
    private _rndRatingUncertainty: number;
    private _rndRatingVolatility: number;

    private _twosRating: number;
    private _twosRatingUncertainty: number;
    private _twosRatingVolatility: number;

    private _foursRating: number;
    private _foursRatingUncertainty: number;
    private _foursRatingVolatility: number;

    private lastOpponenets: AccountMatchmaking[]; 
    private defaultRating: number = 1500; 
    private defaultUncertainty: number = 350; 
    private defaultVolatility: number = 0.06; 




    //Keep the className forwarding for server integration
    constructor(className?: string) {
        super(className)
        //initial values are important for new models
        this.username = 'defaultUsername'

        this.humRating = this.defaultRating;
        this.humRatingUncertainty = this.defaultUncertainty; 
        this.humRatingVolatility = this.defaultVolatility;

        this.orcRating = this.defaultRating;
        this.orcRatingUncertainty = this.defaultUncertainty; 
        this.orcRatingVolatility = this.defaultVolatility;

        this.elfRating = this.defaultRating;
        this.elfRatingUncertainty = this.defaultUncertainty; 
        this.elfRatingVolatility = this.defaultVolatility;

        this.undRating = this.defaultRating;
        this.undRatingUncertainty = this.defaultUncertainty; 
        this.undRatingVolatility = this.defaultVolatility;

        this.rndRating = this.defaultRating;
        this.rndRatingUncertainty = this.defaultUncertainty; 
        this.rndRatingVolatility = this.defaultVolatility;

        this.twosRating = this.defaultRating;
        this.twosRatingUncertainty = this.defaultUncertainty; 
        this.twosRatingVolatility = this.defaultVolatility;

        this.foursRating = this.defaultRating;
        this.foursRatingUncertainty = this.defaultUncertainty; 
        this.foursRatingVolatility = this.defaultVolatility;
    }

    public get username(): string {
        return this._username;
    }

    public set username(value: string) {
        this._username = value;
    }

    public get humRating(): number {
        return this._humRating;
    }

    public set humRating(value: number) {
        this._humRating = value;
    }

    public get humRatingUncertainty(): number {
        return this._humRatingUncertainty;
    }

    public set humRatingUncertainty(value: number) {
        this._humRatingUncertainty = value;
    }

    public get humRatingVolatility(): number {
        return this._humRatingVolatility;
    }

    public set humRatingVolatility(value: number) {
        this._humRatingVolatility = value;
    }

    public get orcRating(): number {
        return this._orcRating;
    }

    public set orcRating(value: number) {
        this._orcRating = value;
    }

    public get orcRatingUncertainty(): number {
        return this._orcRatingUncertainty;
    }

    public set orcRatingUncertainty(value: number) {
        this._orcRatingUncertainty = value;
    }

    public get orcRatingVolatility(): number {
        return this._orcRatingVolatility;
    }

    public set orcRatingVolatility(value: number) {
        this._orcRatingVolatility = value;
    }

    public get elfRating(): number {
        return this._elfRating;
    }

    public set elfRating(value: number) {
        this._elfRating = value;
    }

    public get elfRatingUncertainty(): number {
        return this._elfRatingUncertainty;
    }

    public set elfRatingUncertainty(value: number) {
        this._elfRatingUncertainty = value;
    }

    public get elfRatingVolatility(): number {
        return this._elfRatingVolatility;
    }

    public set elfRatingVolatility(value: number) {
        this._elfRatingVolatility = value;
    }

    public get undRating(): number {
        return this._undRating;
    }

    public set undRating(value: number) {
        this._undRating = value;
    }

    public get undRatingUncertainty(): number {
        return this._undRatingUncertainty;
    }

    public set undRatingUncertainty(value: number) {
        this._undRatingUncertainty = value;
    }

    public get undRatingVolatility(): number {
        return this._undRatingVolatility;
    }

    public set undRatingVolatility(value: number) {
        this._undRatingVolatility = value;
    }

    public get rndRating(): number {
        return this._rndRating;
    }

    public set rndRating(value: number) {
        this._rndRating = value;
    }

    public get rndRatingUncertainty(): number {
        return this._rndRatingUncertainty;
    }

    public set rndRatingUncertainty(value: number) {
        this._rndRatingUncertainty = value;
    }

    public get rndRatingVolatility(): number {
        return this._rndRatingVolatility;
    }

    public set rndRatingVolatility(value: number) {
        this._rndRatingVolatility = value;
    }

    public get twosRating(): number {
        return this._twosRating;
    }

    public set twosRating(value: number) {
        this._twosRating = value;
    }

    public get twosRatingUncertainty(): number {
        return this._twosRatingUncertainty;
    }

    public set twosRatingUncertainty(value: number) {
        this._twosRatingUncertainty = value;
    }

    public get twosRatingVolatility(): number {
        return this._twosRatingVolatility;
    }

    public set twosRatingVolatility(value: number) {
        this._twosRatingVolatility = value;
    }

    public get foursRating(): number {
        return this._foursRating;
    }

    public set foursRating(value: number) {
        this._foursRating = value;
    }

    public get foursRatingUncertainty(): number {
        return this._foursRatingUncertainty;
    }

    public set foursRatingUncertainty(value: number) {
        this._foursRatingUncertainty = value;
    }

    public get foursRatingVolatility(): number {
        return this._foursRatingVolatility;
    }

    public set foursRatingVolatility(value: number) {
        this._foursRatingVolatility = value;
    }
}