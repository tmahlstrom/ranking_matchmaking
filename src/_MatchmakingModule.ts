import { matchmaker } from "./Matchmaker";
import { EventEmitter } from "events";
import { AccountMatchmaking } from "./models/persistent/AccountMatchmaking";

export enum ERealm {
    asia = 1,
    eu = 2,
    us = 4
}

export enum EGameType {
    solo = 1,
    twosRT = 2,
    twosAT = 4,
    foursRT = 8
}

export enum ERace {
    human = 1,
    orc = 2,
    elf = 4,
    undead = 8,
    random = 16
}

export class MatchSearchParams{
    public realm : number = 0; 
    public gameType : number = 0;
    public race : number = 0;
}

export class MatchMadeParams{

    public players : AccountMatchmaking[];
    public races : number[]; 
    public realm : number; 

    public matchID : number; 
}

class MatchmakingModule extends EventEmitter {
    constructor() {
        super();
        //proxy relevant events
        matchmaker.on('something happened', (User1, User2) => {
            //matched
            const matchId = 1;
            this.emit('matched', matchId, [User1, User2])
        })
    }


    public beginMatchSearch(accounts: AccountMatchmaking[], searchDetails : MatchSearchParams[]) {
        matchmaker.beginMatchSearch(accounts, searchDetails); 
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