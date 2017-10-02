import { matchmaker } from "./Matchmaker";
import { EventEmitter } from "events";
import { AccountMatchmaking } from "./models/persistent/AccountMatchmaking";

class MatchmakingModule extends EventEmitter {

    public addAccount(regions: number, gamemodes: number, races: number, account: AccountMatchmaking) {

    }

    public removeAccount(account: AccountMatchmaking) {

    }

    public updateRating(matchId: number, winners: Array<AccountMatchmaking>) {

    }

    public getStatistics() {

    }

    constructor() {
        super();
        //proxy relevant events
        matchmaker.on('something happened', (User1, User2) => {
            //matched
            const matchId = 1;
            this.emit('matched', matchId, [User1, User2])
        })
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