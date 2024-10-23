import TicketCalculationService from "../src/pairtest/service/TicketCalculationService";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest";
import { toBeEmpty } from "jest-extended";
expect.extend({ toBeEmpty });

let calculationService;

describe("Input Validation and Edge Cases", () => {
  beforeEach(() => {
    calculationService = new TicketCalculationService();
  });

  it("throws an error when null is passed", () => {
    expect(() => calculationService.requestCalculation(null)).toThrow();
  });

  it("throws an error when undefined is passed", () => {
    expect(() => calculationService.requestCalculation(undefined)).toThrow();
  });

  it("throws an error when empty array is passed", () => {
    expect(() => calculationService.requestCalculation([])).toThrow();
  });

  it("throws TypeError when invalid ticket type is passed", () => {
    expect(() => {
      new TicketTypeRequest("STUDENT", 1);
    }).toThrow(TypeError);
  });

  it("throws TypeError when non-integer ticket count is passed", () => {
    expect(() => {
      new TicketTypeRequest("ADULT", 1.5);
    }).toThrow(TypeError);
  });
});

describe("Adult Ticket Validations", () => {
  beforeEach(() => {
    calculationService = new TicketCalculationService();
  });

  it("rejects negative number of adult tickets", () => {
    const request = [new TicketTypeRequest("ADULT", -1)];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toContain("please request between 1 and 25 tickets in total");
    expect(response.cost).toBeNull();
    expect(response.totalSeats).toBeNull();
  });

  it("rejects zero adult tickets", () => {
    const request = [new TicketTypeRequest("ADULT", 0)];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toContain("please request between 1 and 25 tickets in total");
    expect(response.cost).toBeNull();
  });

  it("accepts maximum 25 adult tickets", () => {
    const request = [new TicketTypeRequest("ADULT", 25)];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toBeEmpty();
    expect(response.cost).toEqual(625.0);
    expect(response.totalSeats).toEqual(25);
  });

  it("rejects more than 25 adult tickets", () => {
    const request = [new TicketTypeRequest("ADULT", 26)];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toContain("please request between 1 and 25 tickets in total");
  });
});

describe("Child Ticket Validations", () => {
  beforeEach(() => {
    calculationService = new TicketCalculationService();
  });

  it("rejects child ticket without adult ticket", () => {
    const request = [new TicketTypeRequest("CHILD", 1)];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toContain(
      "Child or infant tickets can only be purchased up to the same number of adult ones."
    );
  });

  it("accepts equal number of adult and child tickets", () => {
    const request = [
      new TicketTypeRequest("ADULT", 2),
      new TicketTypeRequest("CHILD", 2)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toBeEmpty();
    expect(response.cost).toEqual(80.0); // 2 * £25 + 2 * £15
    expect(response.totalSeats).toEqual(4);
  });

  it("accepts fewer child tickets than adult tickets", () => {
    const request = [
      new TicketTypeRequest("ADULT", 3),
      new TicketTypeRequest("CHILD", 2)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toBeEmpty();
    expect(response.cost).toEqual(105.0); // 3 * £25 + 2 * £15
    expect(response.totalSeats).toEqual(5);
  });

  it("rejects more child tickets than adult tickets", () => {
    const request = [
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("CHILD", 2)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toContain(
      "Child or infant tickets can only be purchased up to the same number of adult ones."
    );
  });
});

describe("Infant Ticket Validations", () => {
  beforeEach(() => {
    calculationService = new TicketCalculationService();
  });

  it("rejects infant ticket without adult ticket", () => {
    const request = [new TicketTypeRequest("INFANT", 1)];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toContain(
      "Child or infant tickets can only be purchased up to the same number of adult ones."
    );
  });

  it("accepts equal number of adult and infant tickets", () => {
    const request = [
      new TicketTypeRequest("ADULT", 2),
      new TicketTypeRequest("INFANT", 2)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toBeEmpty();
    expect(response.cost).toEqual(50.0); // 2 * £25 + 2 * £0
    expect(response.totalSeats).toEqual(2); // Infants don't need seats
  });

  it("accepts fewer infant tickets than adult tickets", () => {
    const request = [
      new TicketTypeRequest("ADULT", 3),
      new TicketTypeRequest("INFANT", 2)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toBeEmpty();
    expect(response.cost).toEqual(75.0); // 3 * £25 + 2 * £0
    expect(response.totalSeats).toEqual(3);
  });

  it("verifies infants don't count towards seat total", () => {
    const request = [
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("INFANT", 1)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.totalSeats).toEqual(1);
  });
});

describe("Complex Ticket Combinations", () => {
  beforeEach(() => {
    calculationService = new TicketCalculationService();
  });

  it("handles mix of all ticket types within limits", () => {
    const request = [
      new TicketTypeRequest("ADULT", 3),
      new TicketTypeRequest("CHILD", 2),
      new TicketTypeRequest("INFANT", 1)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toBeEmpty();
    expect(response.cost).toEqual(105.0); // 3 * £25 + 2 * £15 + 1 * £0
    expect(response.totalSeats).toEqual(5); // 3 adults + 2 children
  });

  it("rejects when total tickets exceed maximum with mixed types", () => {
    const request = [
      new TicketTypeRequest("ADULT", 24),
      new TicketTypeRequest("CHILD", 1),
      new TicketTypeRequest("INFANT", 1)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toContain("please request between 1 and 25 tickets in total");
  });

  it("handles multiple adult ticket requests separately", () => {
    const request = [
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("CHILD", 1)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toBeEmpty();
    expect(response.cost).toEqual(65.0); // 2 * £25 + 1 * £15
    expect(response.totalSeats).toEqual(3);
  });

  it("rejects when combined child and infant tickets exceed adult tickets", () => {
    const request = [
      new TicketTypeRequest("ADULT", 2),
      new TicketTypeRequest("CHILD", 1),
      new TicketTypeRequest("INFANT", 2)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toContain(
      "Child or infant tickets can only be purchased up to the same number of adult ones."
    );
  });
});

describe("Price and Seat Calculations", () => {
  beforeEach(() => {
    calculationService = new TicketCalculationService();
  });

  it("correctly calculates complex ticket combination costs", () => {
    const request = [
      new TicketTypeRequest("ADULT", 3), // 75
      new TicketTypeRequest("CHILD", 2), // 30
      new TicketTypeRequest("INFANT", 1) // 0
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.cost).toEqual(105.0);
  });

  it("handles maximum possible cost calculation", () => {
    const request = [
      new TicketTypeRequest("ADULT", 13),
      new TicketTypeRequest("CHILD", 12)
    ];
    const response = calculationService.requestCalculation(request);
    expect(response.errors).toBeEmpty();
    expect(response.cost).toEqual(505.0); // 13 * £25 + 12 * £15
    expect(response.totalSeats).toEqual(25);
  });
});