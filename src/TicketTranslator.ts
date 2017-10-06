
import { MatchProcessingTicket } from './models/MatchProcessingTicket';
import { EGameType, ERealm, ERace } from "./models/Enums"; 
import { AccountMatchmaking, MatchSearchTicket, MatchAssignment } from "./models/ExternalModels";

class TicketTranslator {


    public createMatchProcessingTicket(searchDetails : MatchSearchTicket){
        let processingTicket : MatchProcessingTicket = new MatchProcessingTicket;
        processingTicket = this.assignAccountsToTicket(searchDetails, processingTicket); 
        processingTicket = this.assignGameTypesToTicket(searchDetails, processingTicket); 
        processingTicket = this.assignRacesToTicket(searchDetails, processingTicket); 
        processingTicket = this.assignRealmsToTicket(searchDetails, processingTicket);
        processingTicket = this.assignRatingsToTicket(searchDetails, processingTicket);
        
        //console.log(processingTicket);
        return processingTicket; 
    }

    private assignAccountsToTicket (details : MatchSearchTicket, ticket : MatchProcessingTicket){
        ticket.account = details.players[0];
        if (details.players.length >1){
            ticket.partnerAccount = details.players[1]; //only set up to handle twosAT
        }
        return ticket; 
    }
    private assignGameTypesToTicket (details : MatchSearchTicket, ticket : MatchProcessingTicket){
        ticket.gameType = details.gameType;
        return ticket; 
    }

    private assignRacesToTicket (details : MatchSearchTicket, ticket : MatchProcessingTicket){
        ticket.race = details.races[0];
        if (details.players.length >1){
            ticket.partnerRace = details.races[1]; //only set up to handle twosAT
        }
        return ticket; 
    }

    private assignRealmsToTicket (details : MatchSearchTicket, ticket : MatchProcessingTicket){
        ticket.realm = details.realm; 
        return ticket;
    }

    private assignRatingsToTicket (details : MatchSearchTicket, ticket : MatchProcessingTicket){

        if ((details.gameType & EGameType.solo) > 0) { 
            if ((details.races[0] & ERace.human) > 0){
                ticket.ratings.push([EGameType.solo, ERace.human, details.players[0].humRating]);
            }
            if ((details.races[0] & ERace.orc) > 0){
                ticket.ratings.push([EGameType.solo, ERace.orc, details.players[0].orcRating]);
            }
            if ((details.races[0] & ERace.elf) > 0){
                ticket.ratings.push([EGameType.solo, ERace.elf, details.players[0].elfRating]);
            }
            if ((details.races[0] & ERace.undead) > 0){
                ticket.ratings.push([EGameType.solo, ERace.undead, details.players[0].undRating]);
            }  
            if ((details.races[0] & ERace.random) > 0){
                ticket.ratings.push([EGameType.solo, ERace.random, details.players[0].rndRating]);
            }
        }

        if (((details.gameType & EGameType.twosAT) > 0) || ((details.gameType & EGameType.twosRT) > 0)){
            let gType : number = 0; 
            if ((details.gameType & EGameType.twosAT) > 0){
                gType = EGameType.twosAT;
            } else {
                gType = EGameType.twosRT;
            }
            ticket.ratings.push([gType, details.races[0], details.players[0].twosRating]);
            if ((details.gameType === EGameType.twosAT) && details.players.length > 1){
                ticket.partnerRating = details.players[1].twosRating;
            }
        }

        if ((details.gameType & EGameType.foursRT) > 0){
            ticket.ratings.push([EGameType.foursRT, details.races[0], details.players[0].foursRating]);
        }

        return ticket;
    }


    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    public createMatchAssignment(tickets : MatchProcessingTicket[]){            
        let matchAssignment = new MatchAssignment; 
        for (let i = 0; i < tickets.length; i++){
            if (i < tickets.length/2){
                matchAssignment.playersTeam1.push(tickets[i].account);
                matchAssignment.racesTeam1.push(tickets[i].race);
                if (tickets[i] == tickets[i+1]){
                    matchAssignment.playersTeam1.push(tickets[i].partnerAccount); 
                    matchAssignment.racesTeam1.push(tickets[i].partnerRace);
                    i++; 
                }
            }
            else {
                matchAssignment.playersTeam2.push(tickets[i].account);
                matchAssignment.racesTeam2.push(tickets[i].race); 
                if (tickets[i] == tickets[i+1]){
                    matchAssignment.playersTeam2.push(tickets[i].partnerAccount); 
                    matchAssignment.racesTeam2.push(tickets[i].partnerRace);
                    i++; 
                }
            }
        }
        let realmNumber : number; 
        for (let i = 1; i < tickets.length; i++){
            realmNumber = (tickets[0].realm & tickets[i].realm); 
        }
        matchAssignment.realm = realmNumber; 

        if (tickets.length == 2){
            matchAssignment.gameType |= EGameType.solo; 
        }
        if (tickets.length == 4){
            matchAssignment.gameType |= EGameType.twosRT; 
        }
        if (tickets.length == 8){
            matchAssignment.gameType |= EGameType.foursRT; 
        }

        return matchAssignment; 
    }

        


}
export const ticketTranslator: TicketTranslator = new TicketTranslator();