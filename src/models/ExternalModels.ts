import { AccountMatchmaking } from "./persistent/AccountMatchmaking";
export { AccountMatchmaking }; 

export class MatchSearchTicket{
    
    public players : AccountMatchmaking[] = []; //only for AT will this have more than one element
    public races : number[] = []; //only for AT will this have more than one element; e.g., [3, 3] would mean both AT players will play either human or orc
    
    public realm : number = 0; 
    public gameType : number = 0;
        
}

export class MatchAssignment{
    
    public playersTeam1 : AccountMatchmaking[] = [];
    public playersTeam2 : AccountMatchmaking[] = [];
    public racesTeam1 : number[] = []; //playersTeam1[0] is assigned racesTeam1[0], and so on
    public racesTeam2 : number[] = []; 

    public realm : number; 
    public gameType : number; 

    public matchID : number; 

}

