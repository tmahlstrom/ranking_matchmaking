

export class GameSearchTicket {
    public username: string;  //*** needs to be set prior to submission
    public ratings: number[];  //*** needs to be set prior to submission
    public gameType: number;  //*** needs to be set prior to submission
    public realmSearch: number;  //*** needs to be set prior to submission
    public race: number;

    public partner: string;  //*** leave empty if not AT search (if it is an AT search, only one ticket is is requried for the pair)
    public partnerRating: number; //same as above

    //bratingw never needs to be touched to submit search

    public timeOfBeginSearch: number = Date.now();
    public timeOfLastSearchRangeExpansion: number = Date.now();


    public ratingSearchRange: number; 
    public possibleOpponents: Array<GameSearchTicket>  = new Array<GameSearchTicket>();

    public hasBeenMatched: boolean;
    public hadToWaitTime: number;
}