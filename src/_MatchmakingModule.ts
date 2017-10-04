import { matchmaker } from "./Matchmaker";
import { EGameType, ERealm, ERace } from "./models/Enums";
import { EventEmitter } from "events";
import { AccountMatchmaking, MatchSearchTicket, MatchAssignment } from "./models/ExternalModels";



class MatchmakingModule extends EventEmitter {
    
    constructor() {
        super();
        //proxy relevant events
        matchmaker.on('matchMade', (details : MatchAssignment) => {
            //matched
            const matchId = 1; //Get next ID number
            details.matchID = matchId; 
            //add details to list of matches made 
            console.log(details);
            this.emit('matchMade', details)          
        })
    }


    public beginMatchSearch(searchDetails : MatchSearchTicket) {
        matchmaker.beginMatchSearch(searchDetails); 
    }

    public cancelMatchSearch(accounts: AccountMatchmaking[]) {

    }

    public updateRating(matchId: number, winners: AccountMatchmaking[]) {

    }

    public getStatistics() {

    }


    //Only used for debugging to check if the storage integration on the server side still works for the existing models
    public integrationTest(accountMatchmaking: AccountMatchmaking) {
        accountMatchmaking.value1 = 'Hello World';
        accountMatchmaking.value2 = 100;
        accountMatchmaking.store().then((success) => {
            console.log("modified model stored to the database!")
        }, (error) => {
            console.log('Was unable to store: ' + error);
        });
    }
}
export const matchmakingModule: MatchmakingModule = new MatchmakingModule();