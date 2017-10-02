export class PlayerRatingCard{
    username : string; 
    rating : number = 1500;
    ratingUncertainty : number = 250; 
    ratingVolatility : number = 0.06; 

    dateSinceLastGame : Date; //I haven't worked this in yet, but this will be to update the rd in the calculation
}
