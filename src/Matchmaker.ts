import { MatchProcessingTicket } from './models/MatchProcessingTicket';
import { EGameType, ERealm, ERace } from "./models/Enums"; 
import { AccountMatchmaking, MatchSearchTicket, MatchAssignment } from "./models/ExternalModels";
import { EventEmitter } from 'events';
import { ticketTranslator } from "./TicketTranslator";
import { Util } from "./Util";







class Matchmaker extends EventEmitter {

    private searchTickets: Array<MatchProcessingTicket> = new Array<MatchProcessingTicket>();

    
    
    private ticketsToAdd: Array<MatchProcessingTicket> = new Array<MatchProcessingTicket>();
    private ticketsToRemove: Array<MatchProcessingTicket> = new Array<MatchProcessingTicket>();
    private processedTickets: Array<MatchProcessingTicket> = new Array<MatchProcessingTicket>();

    public startingratingSearchRange = 150;
    public ratingBumpForATSearch = 150;
    public secondsUntilSearchExpansion = 2;
    public sizeOfEachSearchExpansion = 50;
    public maxSearchRange = 700;


    public beginMatchSearch(searchDetails : MatchSearchTicket): void {
        let processingTicket : MatchProcessingTicket = ticketTranslator.createMatchProcessingTicket(searchDetails); 
        processingTicket.ratingSearchRange = this.startingratingSearchRange;
        this.ticketsToAdd.push(processingTicket);
        console.log("    added " + processingTicket.account.username + processingTicket.ratings);
    }

    public cancelMatchSearch(accounts: AccountMatchmaking[]): void {
        for (let i = 0; i < accounts.length; i++){
            for (let j = 0; j < this.searchTickets.length; j ++){
                if (accounts[i] === this.searchTickets[j].account){
                    this.ticketsToRemove.push(this.searchTickets[j]); 
                }
            }
        }
    }

    public processSearchTickets(): void {
        this.removeCanceledTickets();
        this.addNewTickets();
        console.log(this.searchTickets.length + " solo tickets being considered");
        this.determinePossibleOpponents();
        this.considerMakingMatches();
        this.removeMatchedTicketsFromSearch();
        this.considerIncreasingSearchRangeOfRemainingTickets();
    }

    public getMatchmakerStateInfo() {

    }

    public handOverProcessedTickets(): Array<MatchProcessingTicket> {
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
        for (let ticket of this.searchTickets) {
            ticket.possibleOpponents = new Array();
            for (let otherTicket of this.searchTickets) {
                if (ticket != otherTicket) {
                    if (this.ticketsAreGameTypeCompatible(ticket, otherTicket)) {
                        if (this.ticketsAreRealmCompatible(ticket, otherTicket) && this.ticketsAreRatingCompatible(ticket, otherTicket)) {
                            this.addPossibleOpponent(ticket, otherTicket); 
                        }
                    }
                }
            }
        }
    }

    private ticketsAreGameTypeCompatible(ticket1: MatchProcessingTicket, ticket2: MatchProcessingTicket) {
        if ((ticket1.gameType & ticket2.gameType) > 0) {
            return true;
        }
        if ((ticket1.gameType == EGameType.twosAT || ticket1.gameType == EGameType.twosRT) && (ticket2.gameType == EGameType.twosAT || ticket2.gameType == EGameType.twosRT)) {
            return true;
        }
        return false;
    }

    private ticketsAreRealmCompatible(ticket1: MatchProcessingTicket, ticket2: MatchProcessingTicket): boolean {
        return (ticket1.realm & ticket2.realm) > 0;
    }


    private ticketsAreRatingCompatible(ticket1: MatchProcessingTicket, ticket2: MatchProcessingTicket): boolean { //each ticket has to be within the elo search range as the other ticket for them to be compatible
        var ratingSearchBump1 = 0;
        var ratingSearchBump2 = 0;
        if ((ticket1.gameType & EGameType.twosAT) > 0) {
            ratingSearchBump1 = this.ratingBumpForATSearch;
        }
        if ((ticket2.gameType & EGameType.twosAT) > 0) {
            ratingSearchBump2 = this.ratingBumpForATSearch;
        }
        for (let i = 0; i < ticket1.ratings.length; i++){
            for (let j = 0; j < ticket2.ratings.length; j++){
                if (ticket1.ratings[i][0] == ticket2.ratings[j][0]){
                    if ((ticket1.ratings[i][2] + ratingSearchBump1 + ticket1.ratingSearchRange > ticket2.ratings[j][2] + ratingSearchBump2) && (ticket1.ratings[i][2] + ratingSearchBump1 - ticket1.ratingSearchRange < ticket2.ratings[j][2] + ratingSearchBump2)) {
                        if ((ticket2.ratings[j][2] + ratingSearchBump2 + ticket2.ratingSearchRange > ticket1.ratings[i][2] + ratingSearchBump1) && (ticket2.ratings[j][2] + ratingSearchBump2 - ticket2.ratingSearchRange < ticket1.ratings[i][2] + ratingSearchBump1)) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    private addPossibleOpponent (ticket: MatchProcessingTicket, otherTicket: MatchProcessingTicket){
        ticket.possibleOpponents.push(otherTicket);
    }

    private considerMakingMatches(): void {
        this.searchTickets.sort((x, y) => x.possibleOpponents.length - y.possibleOpponents.length);//this orders the list based on the number of possible opponnets (low to high). in the matching, it is important to prioritize those with fewer possible opponents. 
        for (let ticket of this.searchTickets) {
            console.log(ticket.account.username + " has " + ticket.possibleOpponents.length + " possible opponnets");
            if (!ticket.hasBeenMatched) {
                if (((ticket.gameType & EGameType.foursRT) > 0) && ticket.possibleOpponents.length >= 7) {
                    this.considerMakingFoursMatch(ticket);
                }
                if ((((ticket.gameType & EGameType.twosAT) > 0) || 
                    ((ticket.gameType & EGameType.twosRT) > 0)) && ticket.possibleOpponents.length >= 3) {
                        this.considerMakingTwosMatch(ticket);
                }
                if (((ticket.gameType & EGameType.solo) > 0) && ticket.possibleOpponents.length >= 1) {
                    this.considerMakingSoloMatch(ticket);
                }
            }
        }
    }

    private considerMakingSoloMatch(ticket: MatchProcessingTicket) {
        for (let i = 0; i < ticket.possibleOpponents.length; i++) {
            if (!ticket.possibleOpponents[i].hasBeenMatched && (ticket.possibleOpponents[i].gameType & EGameType.solo) > 0) {
                this.makeMatch([ticket, ticket.possibleOpponents[i]]);
                break;
            }
        }
    }


    private considerMakingTwosMatch(ticket: MatchProcessingTicket) {
        var twosGroup = new Array();
        twosGroup.push(ticket);
        if (ticket.partnerAccount != null) {
            twosGroup.push(ticket);
        }
        for (let i = 0; i < ticket.possibleOpponents.length && twosGroup.length < 4; i++) {
            let otherTicket : MatchProcessingTicket = ticket.possibleOpponents[i];             
            if (!otherTicket.hasBeenMatched && ((otherTicket.gameType & EGameType.twosRT) > 0) || ((otherTicket.gameType & EGameType.twosAT) > 0)) {
                var groupRealmCompatible = true;
                var teamPlacementWorks = true;
                for (let j = 0; j < twosGroup.length; j++) {
                    if ((otherTicket.realm & twosGroup[j].realm) == 0) {
                        groupRealmCompatible = false;
                    }
                    if (otherTicket.partnerAccount != null && twosGroup.length != 2) {
                        teamPlacementWorks = false;
                    }
                }
                if (groupRealmCompatible && teamPlacementWorks) {
                    twosGroup.push(ticket.possibleOpponents[i]);
                    if (ticket.possibleOpponents[i].partnerAccount != null) {
                        twosGroup.push(ticket.possibleOpponents[i]);
                    }
                }
            }
        }
        if (twosGroup.length === 4) {
            this.makeMatch(twosGroup);
        }
    }


    private considerMakingFoursMatch(ticket: MatchProcessingTicket) {
        var foursGroup = new Array();
        foursGroup.push(ticket);
        for (let i = 0; i < ticket.possibleOpponents.length; i++) {
            let otherTicket : MatchProcessingTicket = ticket.possibleOpponents[i]; 
            if (!otherTicket.hasBeenMatched && ((otherTicket.gameType & EGameType.foursRT) > 0)) {
                var groupRealmCompatible = true;
                for (let j = 0; j < foursGroup.length && foursGroup.length < 8; j++) {
                    if ((ticket.possibleOpponents[i].realm & foursGroup[j].realm) == 0) {
                        groupRealmCompatible = false;
                    }
                }
                if (groupRealmCompatible) {
                    foursGroup.push(ticket.possibleOpponents[i]);
                }
            }
        }
        if (foursGroup.length === 8) {
            this.makeMatch(foursGroup);
        }
    }


    private makeMatch (tickets : MatchProcessingTicket[]){
        for (let ticket of tickets) {
            ticket.hasBeenMatched = true;
            ticket.hadToWaitTime = (Date.now() - ticket.timeOfBeginSearch) / 1000;
        }
        tickets = this.assignRaces(tickets); 
        let matchAssignment = new MatchAssignment; 
        matchAssignment = ticketTranslator.createMatchAssignment(tickets);
        this.emit("matchMade", matchAssignment);
    }

    private assignRaces(tickets : MatchProcessingTicket[]){
        if (tickets.length == 2){
            let ratingMatch : number [][] = this.determineClosestRatingPair (tickets[0].ratings, tickets[1].ratings); 
            console.log(ratingMatch);
            tickets[0].race = ratingMatch[0][1]; 
            tickets[1].race = ratingMatch[1][1]; 
        }
        if (tickets.length >2){
            let assigningPartnerRace : boolean = false; 
            let raceArray = [ERace.human, ERace.orc, ERace.elf, ERace.undead, ERace.random];
            for (let i = 0; i < tickets.length; i ++){
                raceArray = Util.shuffleArray(raceArray);
                for (let j = 0; j < raceArray.length; j ++){
                    if ((tickets[i].race & raceArray[j]) > 0){
                        tickets[i].race = raceArray[j]; 
                        continue; 
                    }
                }
                if (tickets[i] == tickets [i+1]){
                    raceArray = Util.shuffleArray(raceArray);
                    for (let j = 0; j < raceArray.length; j ++){
                        if ((tickets[i].partnerRace & raceArray[j]) > 0){
                            tickets[i].partnerRace = raceArray[j]; 
                            continue; 
                        }
                    }
                }
            }
        }
        return tickets; 
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


    private determineClosestRatingPair (ratings1 : number[][], ratings2 : number [][]): number[][]{
        let ratingsPair : number[][] = []; 
        let closestDistance : number = this.maxSearchRange + 1; 
        for (let i = 0; i < ratings1.length; i++){
            for (let j = 0; j < ratings2.length; j++){
                if (ratings1[i][0] == ratings2[j][0]){
                    let absDif = Math.abs(ratings1[i][2] - ratings2[j][2]); 
                    if (absDif < closestDistance){
                        ratingsPair = [ratings1[i], ratings2[j]]; 
                        closestDistance = absDif;
                    }
                }
            }
        }
        return ratingsPair;
    }

    private connectRatingToRace(rating : number, processingTicket : MatchProcessingTicket) : number{
        let possibleRaceAssignments : number[] = []; 
        if ((processingTicket.race & ERace.human) > 0){
            if (rating == processingTicket.account.humRating){
                possibleRaceAssignments.push(ERace.human); 
            }
        }
        if ((processingTicket.race & ERace.orc) > 0){
            if (rating == processingTicket.account.orcRating){
                possibleRaceAssignments.push(ERace.orc); 
            }
        }
        if ((processingTicket.race & ERace.elf) > 0){
            if (rating == processingTicket.account.elfRating){
                possibleRaceAssignments.push(ERace.elf); 
            }
        }
        if ((processingTicket.race & ERace.undead) > 0){
            if (rating == processingTicket.account.undRating){
                possibleRaceAssignments.push(ERace.undead); 
            }
        }
        if ((processingTicket.race & ERace.random) > 0){
            if (rating == processingTicket.account.rndRating){
                possibleRaceAssignments.push(ERace.random); 
            }
        }
        let raceAssignment : number = possibleRaceAssignments[Math.floor(Math.random() * possibleRaceAssignments.length)];
        return raceAssignment; 
    }


}

export const matchmaker: Matchmaker = new Matchmaker();

