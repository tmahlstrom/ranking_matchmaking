import { AccountMatchmaking } from "./persistent/AccountMatchmaking";

export class MatchProcessingTicket {
    public account: AccountMatchmaking;  //*** needs to be set prior to submission
    public ratings: number[][] = [];  //*** needs to be set prior to submission
    public gameType: number = 0;  //*** needs to be set prior to submission
    public realm: number = 0;  //*** needs to be set prior to submission
    public race: number = 0; //*** needs to be set prior to submission

    public partnerAccount: AccountMatchmaking;  //*** leave empty if not AT search (if it is an AT search, only one ticket is is requried for the pair)
    public partnerRating: number; //same as above
    public partnerRace: number = 0; //same as above

    //below never needs to be touched to submit search

    public timeOfBeginSearch: number = Date.now();
    public timeOfLastSearchRangeExpansion: number = Date.now();


    public ratingSearchRange: number; 
    public possibleOpponents: Array<MatchProcessingTicket>  = new Array<MatchProcessingTicket>();



    public hasBeenMatched: boolean;
    public hadToWaitTime: number;
}