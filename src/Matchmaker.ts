import { GameSearchTicket } from './models/GameSearchTicket';
import { EGameType, ERealm, ERace, MatchSearchParams, MatchMadeParams } from './_MatchmakingModule'; 
import { AccountMatchmaking } from "./models/persistent/AccountMatchmaking";
import { EventEmitter } from 'events';

class Matchmaker extends EventEmitter {

    private searchTickets: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    private ticketsToAdd: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    private ticketsToRemove: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    private processedTickets: Array<GameSearchTicket> = new Array<GameSearchTicket>();

    public startingratingSearchRange = 250;
    public ratingBumpForATSearch = 150;
    public secondsUntilSearchExpansion = 3;
    public sizeOfEachSearchExpansion = 50;
    public maxSearchRange = 700;


    public beginMatchSearch(accounts: AccountMatchmaking[], searchDetails : MatchSearchParams[]): void {
        let gameSearchTicket : GameSearchTicket = this.createGameSearchTicket(accounts, searchDetails); 
        // ticket.ratingSearchRange = this.startingratingSearchRange;
        // this.ticketsToAdd.push(ticket);
        // console.log("    added " + ticket.username);
    }

    private createGameSearchTicket(accounts: AccountMatchmaking[], searchDetails : MatchSearchParams[]){
        let gameSearchTicket = new GameSearchTicket;
        gameSearchTicket.username = accounts[0].username;
        gameSearchTicket.gameType = searchDetails[0].gameType; 
        if (searchDetails[0].gameType === (EGameType.solo)){
            if ((searchDetails[0].race & ERace.human) > 0){
                gameSearchTicket.ratings.push(accounts[0].humRating);
            }
            if ((searchDetails[0].race & ERace.orc) > 0){
                gameSearchTicket.ratings.push(accounts[0].orcRating);
            }
            if ((searchDetails[0].race & ERace.elf) > 0){
                gameSearchTicket.ratings.push(accounts[0].elfRating);
            }
            if ((searchDetails[0].race & ERace.undead) > 0){
                gameSearchTicket.ratings.push(accounts[0].undRating);
            }
            if ((searchDetails[0].race & ERace.random) > 0){
                gameSearchTicket.ratings.push(accounts[0].rndRating);
            }
        }
        if (searchDetails[0].gameType === (EGameType.twosAT | EGameType.twosRT)){
            gameSearchTicket.ratings.push(accounts[0].twosRating);
        }
        if (searchDetails[0].gameType === (EGameType.foursRT)){
            gameSearchTicket.ratings.push(accounts[0].foursRating);
        }
        if (accounts.length === 2){
            gameSearchTicket.partner = accounts[1].username;
            gameSearchTicket.partnerRating = accounts[1].twosRating;
        }
        return gameSearchTicket; 
    }

    public cancelSoloGameSearch(ticket: GameSearchTicket): void {
        if (this.searchTickets.indexOf(ticket) >= 0) {
            this.ticketsToRemove.push(ticket);
        }
    }

    public processSearchTickets(): void {
        this.removeCanceledTickets();
        this.addNewTickets();
        console.log(this.searchTickets.length + " tickets being considered");
        this.determinePossibleOpponents();
        this.considerMakingMatches();
        this.removeMatchedTicketsFromSearch();
        this.considerIncreasingSearchRangeOfRemainingTickets();
    }

    public getMatchmakerStateInfo() {

    }

    public handOverProcessedTickets(): Array<GameSearchTicket> {
        var processedTicketsLedger = this.processedTickets;
        this.processedTickets = new Array();
        return processedTicketsLedger;
    }


    private addNewTickets(): void {
        for (let ticket of this.ticketsToAdd) {
            this.searchTickets.push(ticket);
        }
        this.ticketsToAdd = new Array();
    }

    private removeCanceledTickets(): void {
        for (let ticket of this.ticketsToRemove) {
            this.searchTickets.splice(this.searchTickets.indexOf(ticket));
        }
        this.ticketsToRemove = new Array();
    }

    private determinePossibleOpponents(): void {
        console.log("calculating possible opponents based on game type, rating, and realm");
        for (let ticket of this.searchTickets) {
            ticket.possibleOpponents = new Array();
            for (let otherTicket of this.searchTickets) {
                if (ticket != otherTicket) {
                    if (this.ticketsAreGameTypeCompatible(ticket, otherTicket)) {
                        if (this.ticketsAreRealmCompatible(ticket, otherTicket) && this.ticketsAreRatingCompatible(ticket, otherTicket)) {
                            ticket.possibleOpponents.push(otherTicket);
                        }
                    }
                }
            }
        }
    }

    private ticketsAreGameTypeCompatible(ticket1: GameSearchTicket, ticket2: GameSearchTicket) {
        if ((ticket1.gameType & ticket2.gameType) > 0) {
            return true;
        }

        // if (ticket1.gameType == ticket2.gameType){
        //     return true;
        // }
        if ((ticket1.gameType == EGameType.twosAT || ticket1.gameType == EGameType.twosRT) && (ticket2.gameType == EGameType.twosAT || ticket2.gameType == EGameType.twosRT)) {
            return true;
        }
        return false;
    }

    private ticketsAreRealmCompatible(ticket1: GameSearchTicket, ticket2: GameSearchTicket): boolean {
        return (ticket1.realmSearch & ticket2.realmSearch) > 0;
    }


    private ticketsAreRatingCompatible(ticket1: GameSearchTicket, ticket2: GameSearchTicket): boolean { //each ticket has to be within the elo search range as the other ticket for them to be compatible
        var ratingSearchBump1 = 0;
        var ratingSearchBump2 = 0;
        if (ticket1.gameType === EGameType.twosAT) {
            ratingSearchBump1 = this.ratingBumpForATSearch;
        }
        if (ticket2.gameType === EGameType.twosAT) {
            ratingSearchBump2 = this.ratingBumpForATSearch;
        }
        if ((ticket1.ratings[0] + ratingSearchBump1 + ticket1.ratingSearchRange > ticket2.ratings[0] + ratingSearchBump2) && (ticket1.ratings[0] + ratingSearchBump1 - ticket1.ratingSearchRange < ticket2.ratings[0] + ratingSearchBump2)) {
            if ((ticket2.ratings[0] + ratingSearchBump2 + ticket2.ratingSearchRange > ticket1.ratings[0] + ratingSearchBump1) && (ticket2.ratings[0] + ratingSearchBump2 - ticket2.ratingSearchRange < ticket1.ratings[0] + ratingSearchBump1)) {
                return true;
            }
        }
        return false;
    }

    private considerMakingMatches(): void {
        this.searchTickets.sort((x, y) => x.possibleOpponents.length - y.possibleOpponents.length);//this orders the list based on the number of possible opponnets (low to high). in the matching, it is important to prioritize those with fewer possible opponents. 
        for (let ticket of this.searchTickets) {
            console.log(ticket.username + " has " + ticket.possibleOpponents.length + " possible opponnets");
            if (!ticket.hasBeenMatched) {
                if (ticket.gameType == EGameType.foursRT && ticket.possibleOpponents.length >= 7) {
                    this.considerMakingFoursMatch(ticket);
                }
                if ((ticket.gameType == EGameType.twosAT || ticket.gameType == EGameType.twosRT) && ticket.possibleOpponents.length >= 3) {
                    this.considerMakingTwosMatch(ticket);
                }
                if (ticket.gameType == EGameType.solo && ticket.possibleOpponents.length >= 1) {
                    this.considerMakingSoloMatch(ticket);
                }
            }
        }
    }

    private considerMakingSoloMatch(ticket: GameSearchTicket) {
        for (let i = 0; i < ticket.possibleOpponents.length; i++) {
            if (!ticket.possibleOpponents[i].hasBeenMatched) {
                this.makeSoloMatch([ticket, ticket.possibleOpponents[i]]);
                break;
            }
        }
    }

    private makeSoloMatch(soloTickets: GameSearchTicket[]): void {
        for (let ticket of soloTickets) {
            ticket.hasBeenMatched = true;
            ticket.hadToWaitTime = (Date.now() - ticket.timeOfBeginSearch) / 1000;
        }
        this.announceMatch(soloTickets);
    }

    private considerMakingTwosMatch(ticket: GameSearchTicket) {
        var twosGroup = new Array();
        twosGroup.push(ticket);
        if (ticket.partner != null) {
            twosGroup.push(ticket);
        }
        for (let i = 0; i < ticket.possibleOpponents.length && twosGroup.length < 4; i++) {
            if (!ticket.possibleOpponents[i].hasBeenMatched) {
                var groupRealmCompatible = true;
                var teamPlacementWorks = true;
                for (let j = 0; j < twosGroup.length; j++) {
                    if ((ticket.possibleOpponents[i].realmSearch & twosGroup[j].realmSearch) == 0) {
                        groupRealmCompatible = false;
                    }
                    if (ticket.possibleOpponents[i].partner != null && twosGroup.length != 2) {
                        teamPlacementWorks = false;
                    }
                }
                if (groupRealmCompatible && teamPlacementWorks) {
                    twosGroup.push(ticket.possibleOpponents[i]);
                    if (ticket.possibleOpponents[i].partner != null) {
                        twosGroup.push(ticket.possibleOpponents[i]);
                    }
                }
            }
        }
        if (twosGroup.length === 4) {
            this.makeTwosMatch(twosGroup);
        }
    }

    private makeTwosMatch(twosTickets: GameSearchTicket[]) {
        for (let ticket of twosTickets) {
            ticket.hasBeenMatched = true;
            ticket.hadToWaitTime = (Date.now() - ticket.timeOfBeginSearch) / 1000;
        }
        this.announceMatch(twosTickets);
    }

    private considerMakingFoursMatch(ticket: GameSearchTicket) {
        var foursGroup = new Array();
        foursGroup.push(ticket);
        for (let i = 0; i < ticket.possibleOpponents.length; i++) {
            if (!ticket.possibleOpponents[i].hasBeenMatched) {
                var groupRealmCompatible = true;
                for (let j = 0; j < foursGroup.length && foursGroup.length < 8; j++) {
                    if ((ticket.possibleOpponents[i].realmSearch & foursGroup[j].realmSearch) == 0) {
                        groupRealmCompatible = false;
                    }
                }
                if (groupRealmCompatible) {
                    foursGroup.push(ticket.possibleOpponents[i]);
                }
            }
        }
        if (foursGroup.length === 8) {
            this.makeFoursMatch(foursGroup);
        }
    }

    private makeFoursMatch(foursTickets: GameSearchTicket[]) {
        for (let ticket of foursTickets) {
            ticket.hasBeenMatched = true;
            ticket.hadToWaitTime = (Date.now() - ticket.timeOfBeginSearch) / 1000;
        }
        this.announceMatch(foursTickets);
    }



    private removeMatchedTicketsFromSearch(): void {
        for (let ticket of this.searchTickets) {
            if (ticket.hasBeenMatched) {
                this.processedTickets.push(ticket);
            }
        }
        this.searchTickets = this.searchTickets.filter((ticket) => !ticket.hasBeenMatched)
        console.log(this.searchTickets.length + " tickets remain unmatched\n");
    }


    private considerIncreasingSearchRangeOfRemainingTickets(): void {

        for (let ticket of this.searchTickets) {
            var secondsSinceLastSearchExpansion = (Date.now() - ticket.timeOfLastSearchRangeExpansion) / 1000;
            if (ticket.ratingSearchRange < this.maxSearchRange && secondsSinceLastSearchExpansion > this.secondsUntilSearchExpansion) {
                ticket.ratingSearchRange += this.sizeOfEachSearchExpansion;
            }
        }
    }

    private announceMatch(gameSearchTickets: GameSearchTicket[]) {
        let usernames = new Array(gameSearchTickets.length);
        for (let i = 0; i < usernames.length; i++) {
            usernames[i] = gameSearchTickets[i].username;
        }
        if (usernames.length === 2) {
            this.emit("soloMatchMade", usernames);
        }
        if (usernames.length === 4) {
            if (usernames[0] === usernames[1]) {
                usernames[1] = gameSearchTickets[1].partner;
            }
            if (usernames[2] === usernames[3]) {
                usernames[3] = gameSearchTickets[3].partner;
            }
            this.emit("twosMatchMade", usernames);
        }
        if (usernames.length === 8) {
            this.emit("foursMatchMade", usernames);
        }
    }
}

export const matchmaker: Matchmaker = new Matchmaker();

