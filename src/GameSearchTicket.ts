export enum ERealm {
    asia = 1,
    eu = 2,
    us = 4
}

export enum EGameType {
    solo = 1,
    twoRT,
    twoAT,
    fourRT
}

export class GameSearchTicket {
    public username: string;
    public elo: number;
    public gameType: number;            

    public timeOfBeginSearch: number = Date.now();
    public timeOfLastSearchRangeExpansion: number = Date.now();

    public eloSearchRange: number; //e.g., if this is 100, opponents with +/-100 elo will be accepted. this number is increased incrimentally during the search every so often.
    public possibleOpponents: Array<GameSearchTicket>  = new Array<GameSearchTicket>();

    public realmSearch: number 

    public hasBeenMatched: boolean;
}