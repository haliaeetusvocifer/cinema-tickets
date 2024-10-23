import TicketCalculationResult from "./TicketCalculationResult.js";

export default class TicketCalculationService {
  constructor() {
    this.ADULT_COST = 25.0;
    this.CHILD_COST = 15.0;
    this.INFANT_COST = 0.0;
    this.MAX_TICKETS = 25;
    this.MIN_TICKETS = 1;
  }

  requestCalculation(requests) {
    // Handle null, undefined, and empty array
    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      throw new Error("Invalid ticket request");
    }
    
    const adultCount = this.getTicketTotalFor(requests, "ADULT");
    const childCount = this.getTicketTotalFor(requests, "CHILD");
    const infantCount = this.getTicketTotalFor(requests, "INFANT");
    const totalTickets = adultCount + childCount + infantCount;

    // Handle ticket quantity validations
    if (totalTickets === 0 || totalTickets > this.MAX_TICKETS || 
        requests.some(req => req.getNoOfTickets() < 0)) {
      // Create error result: errors array with message, no seats, no cost
      return new TicketCalculationResult({
        errors: ["please request between 1 and 25 tickets in total"],
        totalSeats: null,
        cost: null
      });
    }

    // Validate child/infant tickets against adult tickets
    if ((childCount > 0 || infantCount > 0) && adultCount === 0) {
      // Create error result: errors array with message, no seats, no cost
      return new TicketCalculationResult({
        errors: ["Child or infant tickets can only be purchased up to the same number of adult ones."],
        totalSeats: null,
        cost: null
      });
    }

    // Validate child + infant count not greater than adult count
    if (childCount + infantCount > adultCount) {
      // Create error result: errors array with message, no seats, no cost
      return new TicketCalculationResult({
        errors: ["Child or infant tickets can only be purchased up to the same number of adult ones."],
        totalSeats: null,
        cost: null
      });
    }

    // If we get here, all validations have passed
    // Calculate total cost and seats
    const totalCost = (adultCount * this.ADULT_COST) + (childCount * this.CHILD_COST);
    const totalSeats = adultCount + childCount;

    // Return successful result with calculated values and no errors
    return new TicketCalculationResult({
      errors: [],
      totalSeats,
      cost: totalCost
    });
  }

  getTicketTotalFor(requests, ticketType) {
    return requests
      .filter(request => request.getTicketType() === ticketType)
      .reduce((sum, request) => sum + request.getNoOfTickets(), 0);
  }
}