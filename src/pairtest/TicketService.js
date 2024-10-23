import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';

export default class TicketService {
  /**
   * Should only have private methods other than the one below.
   */
  #paymentService;
  #seatReservationService;
  #ticketCalculationService;

  constructor(
    paymentService,
    seatReservationService,
    ticketCalculationService
  ) {
    this.#paymentService = paymentService;
    this.#seatReservationService = seatReservationService;
    this.#ticketCalculationService = ticketCalculationService;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException

    try {
      // Validate account ID
      if (!Number.isInteger(accountId) || accountId <= 0) {
        throw new InvalidPurchaseException("Invalid account ID");
      }

      // Use calculation service to validate and calculate tickets
      const calculationResult = this.#ticketCalculationService.requestCalculation(ticketTypeRequests);

      // Check for calculation errors
      if (calculationResult.errors && calculationResult.errors.length > 0) {
        throw new InvalidPurchaseException(`Invalid purchase: ${calculationResult.errors.join(", ")}`);
      }

      // Ensure we have valid results
      if (calculationResult.totalSeats === null || calculationResult.cost === null) {
        throw new InvalidPurchaseException("Invalid calculation result");
      }

      // Convert values to integers for external services
      const totalSeats = Math.round(calculationResult.totalSeats);
      const totalCost = Math.round(calculationResult.cost);

      // Reserve seats first
      try {
        this.#seatReservationService.reserveSeat(accountId, totalSeats);
      } catch (error) {
        if (error instanceof TypeError) {
          throw new InvalidPurchaseException("Invalid seat reservation request");
        }
        throw error;
      }

      // Process payment
      try {
        this.#paymentService.makePayment(accountId, totalCost);
      } catch (error) {
        if (error instanceof TypeError) {
          throw new InvalidPurchaseException("Invalid payment request");
        }
        throw error;
      }

    } catch (error) {
      // Handle known errors or rethrow
      if (error instanceof InvalidPurchaseException) {
        throw error;
      }
      throw new InvalidPurchaseException("Failed to process ticket purchase");
    }
  }
}
