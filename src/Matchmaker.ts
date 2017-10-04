import { MatchProcessingTicket } from './models/MatchProcessingTicket';
import { EGameType, ERealm, ERace } from "./models/Enums"; 
import { AccountMatchmaking, MatchSearchTicket, MatchAssignment } from "./models/ExternalModels";
import { EventEmitter } from 'events';








class Matchmaker extends EventEmitter {

    private searchTickets: Array<MatchProcessingTicket> = new Array<MatchProcessingTicket>();
    private ticketsToAdd: Array<MatchProcessingTicket> = new Array<MatchProcessingTicket>();
    private ticketsToRemove: Array<MatchProcessingTicket> = new Array<MatchProcessingTicket>();
    private processedTickets: Array<MatchProcessingTicket> = new Array<MatchProcessingTicket>();

    public startingratingSearchRange = 250;
    public ratingBumpForATSearch = 150;
    public secondsUntilSearchExpansion = 3;
    public sizeOfEachSearchExpansion = 50;
    public maxSearchRange = 700;


    public beginMatchSearch(searchDetails : MatchSearchTicket): void {
        let processingTicket : MatchProcessingTicket = this.createMatchProcessingTicket(searchDetails); 
        this.ticketsToAdd.push(processingTicket);
        console.log("    added " + processingTicket.account.username);
    }

    private createMatchProcessingTicket(searchDetails : MatchSearchTicket){
        let processingTicket : MatchProcessingTicket = new MatchProcessingTicket;
        processingTicket.account = searchDetails.players[0];
        processingTicket.gameType = searchDetails.gameType;
        processingTicket.race = searchDetails.races[0]; 
        processingTicket.realm = searchDetails.realm; 
        if (searchDetails.gameType === (EGameType.solo)){
            if ((searchDetails.races[0] & ERace.human) > 0){
                processingTicket.ratings.push(searchDetails.players[0].humRating);
            }
            if ((searchDetails.races[0] & ERace.orc) > 0){
                processingTicket.ratings.push(searchDetails.players[0].orcRating);
            }
            if ((searchDetails.races[0] & ERace.elf) > 0){
                processingTicket.ratings.push(searchDetails.players[0].elfRating);
            }
            if ((searchDetails.races[0] & ERace.undead) > 0){
                processingTicket.ratings.push(searchDetails.players[0].undRating);
            }
            if ((searchDetails.races[0] & ERace.random) > 0){
                processingTicket.ratings.push(searchDetails.players[0].rndRating);
            }
            processingTicket.ratingSearchRange = this.startingratingSearchRange;
        }
        console.log(processingTicket);
        // if (searchDetails[0].gameType === (EGameType.twosAT | EGameType.twosRT)){
        //     MatchProcessingTicket.ratings.push(accounts[0].twosRating);
        // }
        // if (searchDetails[0].gameType === (EGameType.foursRT)){
        //     MatchProcessingTicket.ratings.push(accounts[0].foursRating);
        // }
        // if (accounts.length === 2){
        //     MatchProcessingTicket.partner = accounts[1].username;
        //     MatchProcessingTicket.partnerRating = accounts[1].twosRating;
        // }
        return processingTicket; 
    }

    public cancelSoloGameSearch(ticket: MatchProcessingTicket): void {
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
        if (ticket1.gameType === EGameType.twosAT) {
            ratingSearchBump1 = this.ratingBumpForATSearch;
        }
        if (ticket2.gameType === EGameType.twosAT) {
            ratingSearchBump2 = this.ratingBumpForATSearch;
        }
        for (let i = 0; i < ticket1.ratings.length; i++){
            for (let j = 0; j < ticket2.ratings.length; j++){
                if ((ticket1.ratings[i] + ratingSearchBump1 + ticket1.ratingSearchRange > ticket2.ratings[j] + ratingSearchBump2) && (ticket1.ratings[i] + ratingSearchBump1 - ticket1.ratingSearchRange < ticket2.ratings[j] + ratingSearchBump2)) {
                    if ((ticket2.ratings[j] + ratingSearchBump2 + ticket2.ratingSearchRange > ticket1.ratings[i] + ratingSearchBump1) && (ticket2.ratings[j] + ratingSearchBump2 - ticket2.ratingSearchRange < ticket1.ratings[i] + ratingSearchBump1)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private considerMakingMatches(): void {
        this.searchTickets.sort((x, y) => x.possibleOpponents.length - y.possibleOpponents.length);//this orders the list based on the number of possible opponnets (low to high). in the matching, it is important to prioritize those with fewer possible opponents. 
        for (let ticket of this.searchTickets) {
            console.log(ticket.account.username + " has " + ticket.possibleOpponents.length + " possible opponnets");
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

    private considerMakingSoloMatch(ticket: MatchProcessingTicket) {
        for (let i = 0; i < ticket.possibleOpponents.length; i++) {
            if (!ticket.possibleOpponents[i].hasBeenMatched) {
                this.makeSoloMatch([ticket, ticket.possibleOpponents[i]]);
                break;
            }
        }
    }

    private makeSoloMatch(soloTickets: MatchProcessingTicket[]): void {
        for (let ticket of soloTickets) {
            ticket.hasBeenMatched = true;
            ticket.hadToWaitTime = (Date.now() - ticket.timeOfBeginSearch) / 1000;
        }
        this.packageMatchAnnouncement(soloTickets);
    }

    private considerMakingTwosMatch(ticket: MatchProcessingTicket) {
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
                    if ((ticket.possibleOpponents[i].realm & twosGroup[j].realmSearch) == 0) {
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

    private makeTwosMatch(twosTickets: MatchProcessingTicket[]) {
        for (let ticket of twosTickets) {
            ticket.hasBeenMatched = true;
            ticket.hadToWaitTime = (Date.now() - ticket.timeOfBeginSearch) / 1000;
        }
        this.packageMatchAnnouncement(twosTickets);
    }

    private considerMakingFoursMatch(ticket: MatchProcessingTicket) {
        var foursGroup = new Array();
        foursGroup.push(ticket);
        for (let i = 0; i < ticket.possibleOpponents.length; i++) {
            if (!ticket.possibleOpponents[i].hasBeenMatched) {
                var groupRealmCompatible = true;
                for (let j = 0; j < foursGroup.length && foursGroup.length < 8; j++) {
                    if ((ticket.possibleOpponents[i].realm & foursGroup[j].realmSearch) == 0) {
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

    private makeFoursMatch(foursTickets: MatchProcessingTicket[]) {
        for (let ticket of foursTickets) {
            ticket.hasBeenMatched = true;
            ticket.hadToWaitTime = (Date.now() - ticket.timeOfBeginSearch) / 1000;
        }
        this.packageMatchAnnouncement(foursTickets);
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

    private packageMatchAnnouncement(processingTickets: MatchProcessingTicket[]) {

        let matchAssignment = new MatchAssignment; 
        for (let i = 0; i < processingTickets.length; i++){
            if (i < processingTickets.length/2){
                matchAssignment.playersTeam1.push(processingTickets[i].account); 
            }
            else {
                matchAssignment.playersTeam2.push(processingTickets[i].account);
            }
        }
        let realmNumber : number; 
        for (let i = 1; i < processingTickets.length; i++){
            realmNumber = (processingTickets[0].realm & processingTickets[i].realm); 
        }
        matchAssignment.realm = realmNumber; 

        if (processingTickets.length == 2){
            matchAssignment.gameType |= EGameType.solo; 
            let ratingMatch : number [] = this.determineClosestRatingPair (processingTickets[0].ratings, processingTickets[1].ratings); 
            console.log(ratingMatch); 
            let race1:number = this.connectRatingToRace(ratingMatch[0], processingTickets[0]);
            matchAssignment.racesTeam1.push(race1);
            let race2:number = this.connectRatingToRace(ratingMatch[1], processingTickets[1]);
            matchAssignment.racesTeam2.push(race2);
            let raceNumber = matchAssignment.racesTeam1[0]; 
            console.log(ERace[raceNumber]); 
            raceNumber = matchAssignment.racesTeam2[0]; 
            console.log(ERace[raceNumber]); 
        }
        if (processingTickets.length == 4){
            matchAssignment.gameType |= EGameType.twosRT; 
        }
        if (processingTickets.length == 8){
            matchAssignment.gameType |= EGameType.foursRT; 
        }


        this.emit("matchMade", matchAssignment);

        let usernames = new Array(processingTickets.length);
        for (let i = 0; i < usernames.length; i++) {
            usernames[i] = processingTickets[i].account.username;
        }
        if (usernames.length === 2) {
            this.emit("soloMatchMade", usernames);
        }
        if (usernames.length === 4) {
            if (usernames[0] === usernames[1]) {
                usernames[1] = processingTickets[1].partner;
            }
            if (usernames[2] === usernames[3]) {
                usernames[3] = processingTickets[3].partner;
            }
            this.emit("twosMatchMade", usernames);
        }
        if (usernames.length === 8) {
            this.emit("foursMatchMade", usernames);
        }
    }


    private determineClosestRatingPair (ratings1 : number[], ratings2 : number []): number[]{
        let ratingsPair : number [] = []; 
        let closestDistance : number = this.maxSearchRange + 1; 
        for (let i = 0; i < ratings1.length; i++){
            for (let j = 0; j < ratings2.length; j++){
                let absDif = Math.abs(ratings1[i] - ratings2[j]); 
                if (absDif < closestDistance){
                    ratingsPair = [ratings1[i], ratings2[j]]; 
                    closestDistance = absDif;
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

