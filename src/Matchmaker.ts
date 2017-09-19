import { GameSearchTicket, ERealm, EGameType } from './GameSearchTicket';
import { EventEmitter } from 'events';

class MatchMaker extends EventEmitter {

    private searchTickets: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    private ticketsToAdd: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    private ticketsToRemove: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    private processedTickets: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    

    /// <summary>
    /// these varaibles can be tweaked to make finding games easier when there is low traffic. 
    /// probably the best way to do this is to do two things: 
    /// 1. reduce secondsUntilSearchExpansion; right now, the max search range is achieved after 200 seconds
    /// 2. increase the maxSearchRange. 400 elo is already a pretty big skill difference, but espeically at the very top level we might have to increase this to find games.
    /// </summary>
    public startingEloSearchRange = 200;
    public eloBumpForATSearch = 150; 
    public secondsUntilSearchExpansion = 3;
    public sizeOfEachSearchExpansion = 20;
    public maxSearchRange = 600;

    //3 key public functions: add ticket to search, remove ticket from search, and process the tickets
    public beginGameSearch(ticket: GameSearchTicket): void {//new tickets are first added to a temp list, so that they can be added to the real list at a convenient time (safter in case we use coroutines or something at some point)
        ticket.eloSearchRange = this.startingEloSearchRange;
        this.ticketsToAdd.push(ticket);
        console.log("    added " + ticket.username);
    }

    public cancelSoloGameSearch(ticket: GameSearchTicket): void {//same as for adding
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

    public handOverProcessedTickets(): Array<GameSearchTicket>{
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
        console.log("calculating possible opponents based on game type, elo, and realm");
        for (let ticket of this.searchTickets) {
            ticket.possibleOpponents = new Array();
            for (let otherTicket of this.searchTickets) {
                if (ticket != otherTicket) {
                    if (this.ticketsAreGameTypeCompatible(ticket, otherTicket)){
                        if (this.ticketsAreRealmCompatible(ticket, otherTicket) && this.ticketsAreEloCompatible(ticket, otherTicket)) {
                            ticket.possibleOpponents.push(otherTicket);
                        }
                    }
                }
            }
        }
    }

    private ticketsAreGameTypeCompatible(ticket1: GameSearchTicket, ticket2: GameSearchTicket){
        if (ticket1.gameType == ticket2.gameType){
            return true;
        }
        if ((ticket1.gameType == 2 || ticket1.gameType == 3) && (ticket2.gameType == 2 || ticket2.gameType == 3)){
            return true;
        }
        return false;
    }

    private ticketsAreRealmCompatible(ticket1: GameSearchTicket, ticket2: GameSearchTicket): boolean {
        return (ticket1.realmSearch & ticket2.realmSearch) > 0;
    }


    private ticketsAreEloCompatible(ticket1: GameSearchTicket, ticket2: GameSearchTicket): boolean { //each ticket has to be within the elo search range as the other ticket for them to be compatible
        var eloSearchBump1 = 0; 
        var eloSearchBump2 = 0; 
        if (ticket1.gameType === EGameType.twoAT){
            eloSearchBump1 = this.eloBumpForATSearch; 
        }
        if (ticket2.gameType === EGameType.twoAT){
            eloSearchBump2 = this.eloBumpForATSearch; 
        }
        if ((ticket1.elo + eloSearchBump1 + ticket1.eloSearchRange > ticket2.elo + eloSearchBump2) && (ticket1.elo + eloSearchBump1 - ticket1.eloSearchRange < ticket2.elo + eloSearchBump2)) {
            if ((ticket2.elo + eloSearchBump2 + ticket2.eloSearchRange > ticket1.elo + eloSearchBump1) && (ticket2.elo + eloSearchBump2 - ticket2.eloSearchRange < ticket1.elo + eloSearchBump1)) {
                return true;
            }
        }
        return false;
    }

    private considerMakingMatches(): void {
        this.searchTickets.sort((x, y) => x.possibleOpponents.length - y.possibleOpponents.length);//this orders the list based on the number of possible opponnets (low to high). in the matching, it is important to prioritize those with fewer possible opponents. 
        for (let ticket of this.searchTickets) {
            console.log("    " + ticket.username + "has " + ticket.possibleOpponents.length + " possible opponents");
        }
        for (let ticket of this.searchTickets) {
            if (!ticket.hasBeenMatched){
                if (ticket.gameType == 1 && ticket.possibleOpponents.length >= 1){
                    this.considerMakingSoloMatch(ticket);
                }
                if ((ticket.gameType == 2 || ticket.gameType == 3) && ticket.possibleOpponents.length >= 3){
                    this.considerMakingTwosMatch(ticket);
                }
                if (ticket.gameType == 4){
                    this.considerMakingFoursMatch(ticket);
                }
            }
        }
       
    }

    private considerMakingSoloMatch(ticket: GameSearchTicket){
        for (let i = 0; i < ticket.possibleOpponents.length; i++) {
            if (!ticket.possibleOpponents[i].hasBeenMatched) {
                this.makeSoloMatch(ticket, ticket.possibleOpponents[i]);
                break;
            }
        }
    }

    private makeSoloMatch(ticket1: GameSearchTicket, ticket2: GameSearchTicket): void {
        ticket1.hasBeenMatched = true;
        ticket1.hadToWaitTime = (Date.now() - ticket1.timeOfBeginSearch) / 1000;
        ticket2.hasBeenMatched = true;
        ticket2.hadToWaitTime = (Date.now() - ticket2.timeOfBeginSearch) / 1000;
        this.emit("soloMatchMade", ticket1, ticket2);
    }

    private considerMakingTwosMatch(ticket: GameSearchTicket){
        var twosGroup = new Array();
        twosGroup.push(ticket);
        if (ticket.partner != null){
            twosGroup.push(ticket);
        }
        for (let i = 0; i < ticket.possibleOpponents.length && twosGroup.length < 4; i++) {
            if (!ticket.possibleOpponents[i].hasBeenMatched) {
                var groupRealmCompatible = true; 
                var teamPlacementWorks = true; 
                for (let j = 0; j < twosGroup.length; j++) {
                    if ((ticket.possibleOpponents[i].realmSearch & twosGroup[j].realmSearch) == 0){
                        groupRealmCompatible = false; 
                    }
                    if (ticket.possibleOpponents[i].partner != null && twosGroup.length != 2){
                        teamPlacementWorks = false;
                    }
                }
                if (groupRealmCompatible && teamPlacementWorks){
                    twosGroup.push(ticket.possibleOpponents[i]);
                    if (ticket.possibleOpponents[i].partner != null){
                        twosGroup.push(ticket.possibleOpponents[i]);
                    }
                }
            }
        }
        if (twosGroup.length === 4){
            this.makeTwosMatch(twosGroup);
        }
    }

    private makeTwosMatch(twosTickets: GameSearchTicket[]){
        for (let ticket of twosTickets){
            ticket.hasBeenMatched = true;
            ticket.hadToWaitTime = (Date.now() - ticket.timeOfBeginSearch) / 1000;
        }
        this.emit("twosMatchMade", twosTickets);
    }

    private considerMakingFoursMatch(ticket: GameSearchTicket){
        var foursGroup = new Array();
        foursGroup.push(ticket);
        for (let i = 0; i < ticket.possibleOpponents.length; i++) {
            if (!ticket.possibleOpponents[i].hasBeenMatched) {
                var groupRealmCompatible = true; 
                for (let j = 0; j < foursGroup.length && foursGroup.length < 8; j++) {
                    if ((ticket.possibleOpponents[i].realmSearch & foursGroup[j].realmSearch) == 0){
                        groupRealmCompatible = false; 
                    }
                }
                if (groupRealmCompatible){
                    foursGroup.push(ticket.possibleOpponents[i]);
                }
            }
        }
        if (foursGroup.length === 8){
            this.makeFoursMatch(foursGroup);
        }
    }

    private makeFoursMatch(foursTickets: GameSearchTicket[]){
        for (let ticket of foursTickets){
            ticket.hasBeenMatched = true;
            ticket.hadToWaitTime = (Date.now() - ticket.timeOfBeginSearch) / 1000;
        }
        this.emit("foursMatchMade", foursTickets);
    }
        


    private removeMatchedTicketsFromSearch(): void {
        for (let ticket of this.searchTickets){
            if (ticket.hasBeenMatched){
                this.processedTickets.push(ticket);
            }
        }
        this.searchTickets = this.searchTickets.filter((ticket) => !ticket.hasBeenMatched)
        console.log(this.searchTickets.length + " tickets remain unmatched\n");
    }


    private considerIncreasingSearchRangeOfRemainingTickets(): void {
        
        for (let ticket of this.searchTickets) {
            var secondsSinceLastSearchExpansion = (Date.now() - ticket.timeOfLastSearchRangeExpansion) / 1000;
            if (ticket.eloSearchRange < this.maxSearchRange && secondsSinceLastSearchExpansion > this.secondsUntilSearchExpansion) {
                ticket.eloSearchRange += this.sizeOfEachSearchExpansion;
            }
        }
    }
}
export var matchMaker: MatchMaker = new MatchMaker();