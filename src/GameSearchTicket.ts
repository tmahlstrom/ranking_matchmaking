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
    public username: string;  //*** needs to be set prior to submission
    public elo: number;  //*** needs to be set prior to submission
    public gameType: number;  //*** needs to be set prior to submission
    public realmSearch: number  //*** needs to be set prior to submission

    public partner: string;  //*** leave empty if not AT search (if it is an AT search, only one ticket is is requried for the pair)
    public partnerElo: number; //same as above

    //below never needs to be touched to submit search

    public timeOfBeginSearch: number = Date.now();
    public timeOfLastSearchRangeExpansion: number = Date.now();

    public eloSearchRange: number; 
    public possibleOpponents: Array<GameSearchTicket>  = new Array<GameSearchTicket>();

    public hasBeenMatched: boolean;
    public hadToWaitTime: number;
}