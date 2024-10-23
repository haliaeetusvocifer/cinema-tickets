import TicketPaymentService from "../src/thirdparty/paymentgateway/TicketPaymentService";
import SeatReservationService from "../src/thirdparty/seatbooking/SeatReservationService";
import TicketCalculationService from "../src/pairtest/service/TicketCalculationService";
import TicketCalculationResult from "../src/pairtest/service/TicketCalculationResult";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException";
jest.mock("../src/thirdparty/seatbooking/SeatReservationService");
jest.mock("../src/thirdparty/paymentgateway/TicketPaymentService");
jest.mock("../src/pairtest/service/TicketCalculationService");

import { toBeEmpty } from "jest-extended";
import TicketService from "../src/pairtest/TicketService";

expect.extend({ toBeEmpty });

const mockMakePayment = jest.fn(() => {
  console.log("Payment Successful");
});

const mockReserveSeat = jest.fn(() => {
  console.log("Seat Reservation Successful");
});

describe("Mock out service injections and test Ticket Service", () => {
  beforeAll(() => {
    SeatReservationService.mockImplementation(() => ({
      reserveSeat: mockReserveSeat
    }));
    
    TicketPaymentService.mockImplementation(() => ({
      makePayment: mockMakePayment
    }));
  });

  beforeEach(() => {
    SeatReservationService.mockClear();
    TicketPaymentService.mockClear();
    TicketCalculationService.mockClear();
  });

  it("empty result, throws an error", () => {
    TicketCalculationService.mockImplementation(() => ({
      requestCalculation: jest.fn().mockImplementation(() => 
        new TicketCalculationResult({
          errors: ["Some Error"],
          totalSeats: null,
          cost: null
        })
      )
    }));

    const ticketPaymentService = new TicketPaymentService();
    const seatReservationService = new SeatReservationService();
    const ticketCalculationService = new TicketCalculationService();
    const ticketService = new TicketService(
      ticketPaymentService,
      seatReservationService,
      ticketCalculationService
    );

    expect(() => 
      ticketService.purchaseTickets(12345, [])
    ).toThrow(InvalidPurchaseException);

    expect(ticketCalculationService.requestCalculation).toBeCalled();
    expect(seatReservationService.reserveSeat).not.toBeCalled();
    expect(ticketPaymentService.makePayment).not.toBeCalled();
  });

  it("valid result, calls the other services", () => {
    TicketCalculationService.mockImplementation(() => ({
      requestCalculation: jest.fn().mockImplementation(() => 
        new TicketCalculationResult({
          errors: [],
          totalSeats: 5,
          cost: 100.0
        })
      )
    }));

    const ticketPaymentService = new TicketPaymentService();
    const seatReservationService = new SeatReservationService();
    const ticketCalculationService = new TicketCalculationService();
    const ticketService = new TicketService(
      ticketPaymentService,
      seatReservationService,
      ticketCalculationService
    );

    expect(() => 
      ticketService.purchaseTickets(12345, [])
    ).not.toThrow();

    expect(ticketCalculationService.requestCalculation).toBeCalled();
    expect(seatReservationService.reserveSeat).toBeCalled();
    expect(ticketPaymentService.makePayment).toBeCalled();
  });
});