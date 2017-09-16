import { GameSearchTicket } from './GameSearchTicket';
import { EventEmitter } from 'events';

class MatchMaker extends EventEmitter {

    private searchTickets: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    private ticketsToAdd: Array<GameSearchTicket> = new Array<GameSearchTicket>();
    private ticketsToRemove: Array<GameSearchTicket> = new Array<GameSearchTicket>();

    /// <summary>
    /// these varaibles can be tweaked to make finding games easier when there is low traffic. 
    /// probably the best way to do this is to do two things: 
    /// 1. reduce secondsUntilSearchExpansion; right now, the max search range is achieved after 200 seconds
    /// 2. increase the maxSearchRange. 400 elo is already a pretty big skill difference, but espeically at the very top level we might have to increase this to find games.
    /// </summary>
    public startingEloSearchRange = 50;
    public secondsUntilSearchExpansion = 10;
    public sizeOfEachSearchExpansion = 20;
    public maxSearchRange = 400;

    //3 key public functions: add ticket to search, remove ticket from search, and process the tickets
    public beginSoloGameSearch(ticket: GameSearchTicket): void {//new tickets are first added to a temp list, so that they can be added to the real list at a convenient time (safter in case we use coroutines or something at some point)
        ticket.eloSearchRange = this.startingEloSearchRange;
        this.ticketsToAdd.push(ticket);
        console.log("added " + ticket.username);

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
        console.log("calculating possible opponents based on elo and realm");
        this.determinePossibleOpponents();
        this.considerMakingMatches();
        this.removeMatchedTicketsFromList();
        this.considerIncreasingSearchRangeOfRemainingTickets();
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
        for (let ticket of this.searchTickets) {
            ticket.possibleOpponents = new Array();
            for (let otherTicket of this.searchTickets) {
                if (ticket != otherTicket) {
                    if (this.ticketsAreRealmCompatible(ticket, otherTicket) && this.ticketsAreEloCompatible(ticket, otherTicket)) {
                        ticket.possibleOpponents.push(otherTicket);
                    }
                }
            }
        }
    }


    private ticketsAreRealmCompatible(ticket1: GameSearchTicket, ticket2: GameSearchTicket): boolean {
        return (ticket1.realmSearch & ticket2.realmSearch) > 0;
    }


    private ticketsAreEloCompatible(ticket1: GameSearchTicket, ticket2: GameSearchTicket): boolean { //each ticket has to be within the elo search range as the other ticket for them to be compatible
        if (ticket1.elo + ticket1.eloSearchRange > ticket2.elo && ticket1.elo - ticket1.eloSearchRange < ticket2.elo) {
            if (ticket2.elo + ticket2.eloSearchRange > ticket1.elo && ticket2.elo - ticket2.eloSearchRange < ticket1.elo) {
                return true;
            }
        }
        return false;
    }

    private considerMakingMatches(): void {
        this.searchTickets.sort((x, y) => x.possibleOpponents.length - y.possibleOpponents.length);//this orders the list based on the number of possible opponnets (low to high). in the matching, it is important to prioritize those with fewer possible opponents. 
        for (let ticket of this.searchTickets) {
            console.log("    " + ticket.username + " has " + ticket.possibleOpponents.length + " possible opponents");
        }

        for (let ticket of this.searchTickets) {
            if (ticket.possibleOpponents.length > 0 && !ticket.hasBeenMatched) {
                for (let i = 0; i < ticket.possibleOpponents.length; i++) {
                    if (!ticket.possibleOpponents[i].hasBeenMatched) {
                        this.makeMatch(ticket, ticket.possibleOpponents[i]);
                        break;
                    }
                }
            }
        }
    }

    private makeMatch(ticket1: GameSearchTicket, ticket2: GameSearchTicket): void {
        ticket1.hasBeenMatched = true;
        ticket2.hasBeenMatched = true;
        this.emit("matched", ticket1, ticket2);
    }

    private removeMatchedTicketsFromList(): void {
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