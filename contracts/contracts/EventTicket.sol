// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title EventTicket (v2): tiered pricing, escrowed payments, refunds
contract EventTicket {
    enum TicketStatus { Unsold, Sold, Used, Cancelled, Refunded }
    enum Tier { General, Premium, VIP }

    // owner, status and tier are packed together to keep storage (and gas) low
    struct Ticket {
        uint256 id;
        address owner;
        TicketStatus status;
        Tier tier;
        uint256 purchasePrice;
        uint256 seat;   // seat number inside the tier (1, 2, 3, ...)
    }

    address public organizer;
    string public eventName;
    uint256 public maxTickets;
    uint256 public ticketsIssued;
    uint256 public eventEnd;          // unix time; proceeds can be withdrawn after this
    bool public eventCancelled;
    bool public proceedsWithdrawn;
    uint256 public heldFunds;         // ticket payments held by the contract (escrow)

    mapping(Tier => uint256) public tierPrice;
    mapping(Tier => uint256) public tierIssued;
    mapping(uint256 => Ticket) public tickets;
    mapping(address => uint256[]) public ticketsOwnedBy;

    event TicketIssued(uint256 indexed ticketId, address indexed owner, uint256 price);
    event TicketPurchased(uint256 indexed ticketId, address indexed buyer, uint256 price);
    event TicketTransferred(uint256 indexed ticketId, address indexed from, address indexed to);
    event TicketValidated(uint256 indexed ticketId, address indexed validator);
    event TicketCancelled(uint256 indexed ticketId, address indexed owner, uint256 refundAmount);
    event EventCancelledAndRefunded();
    event ProceedsWithdrawn(address indexed organizer, uint256 amount);

    modifier onlyOrganizer() {
        require(msg.sender == organizer, "Only organizer can perform this action");
        _;
    }

    modifier ticketExists(uint256 ticketId) {
        require(ticketId < ticketsIssued, "Ticket does not exist");
        _;
    }

    modifier eventNotCancelled() {
        require(!eventCancelled, "Event has been cancelled");
        _;
    }

    constructor(
        string memory _eventName,
        uint256 _maxTickets,
        uint256 _eventEnd,
        uint256 _generalPrice,
        uint256 _premiumPrice,
        uint256 _vipPrice
    ) {
        require(_maxTickets > 0, "maxTickets must be > 0");
        organizer = msg.sender;
        eventName = _eventName;
        maxTickets = _maxTickets;
        eventEnd = _eventEnd;
        tierPrice[Tier.General] = _generalPrice;
        tierPrice[Tier.Premium] = _premiumPrice;
        tierPrice[Tier.VIP] = _vipPrice;
    }

    /// Kept so older code that reads ticketPrice() still works (General price).
    function ticketPrice() external view returns (uint256) {
        return tierPrice[Tier.General];
    }

    function getTierPrices() external view returns (uint256[3] memory prices) {
        prices[0] = tierPrice[Tier.General];
        prices[1] = tierPrice[Tier.Premium];
        prices[2] = tierPrice[Tier.VIP];
    }

    function issueTickets(Tier tier, uint256 count) external onlyOrganizer eventNotCancelled {
        require(count > 0, "count must be > 0");
        require(ticketsIssued + count <= maxTickets, "Exceeds max ticket supply");
        uint256 price = tierPrice[tier];
        for (uint256 i = 0; i < count; i++) {
            uint256 newId = ticketsIssued;
            tierIssued[tier]++;
            tickets[newId] = Ticket({
                id: newId,
                owner: organizer,
                status: TicketStatus.Unsold,
                tier: tier,
                purchasePrice: 0,
                seat: tierIssued[tier]
            });
            ticketsIssued++;
            emit TicketIssued(newId, organizer, price);
        }
    }

    function purchaseTicket(uint256 ticketId) external payable ticketExists(ticketId) eventNotCancelled {
        Ticket storage t = tickets[ticketId];
        require(t.status == TicketStatus.Unsold, "Ticket is not available for purchase");
        require(msg.value == tierPrice[t.tier], "Incorrect payment amount");
        t.owner = msg.sender;
        t.status = TicketStatus.Sold;
        t.purchasePrice = msg.value;
        ticketsOwnedBy[msg.sender].push(ticketId);
        heldFunds += msg.value; // held in escrow until the event ends
        emit TicketPurchased(ticketId, msg.sender, msg.value);
    }

    function transferTicket(uint256 ticketId, address to) external ticketExists(ticketId) eventNotCancelled {
        Ticket storage t = tickets[ticketId];
        require(t.owner == msg.sender, "Only the ticket owner can transfer it");
        require(t.status == TicketStatus.Sold, "Only sold, unused tickets can be transferred");
        require(to != address(0), "Cannot transfer to the zero address");
        require(to != msg.sender, "Cannot transfer to yourself");
        address from = t.owner;
        t.owner = to;
        _removeFromOwnedList(from, ticketId);
        ticketsOwnedBy[to].push(ticketId);
        emit TicketTransferred(ticketId, from, to);
    }

    function validateTicket(uint256 ticketId) external onlyOrganizer ticketExists(ticketId) eventNotCancelled {
        Ticket storage t = tickets[ticketId];
        require(t.status == TicketStatus.Sold, "Ticket is not valid for entry");
        t.status = TicketStatus.Used;
        emit TicketValidated(ticketId, msg.sender);
    }

    function isTicketValid(uint256 ticketId) external view ticketExists(ticketId) returns (bool) {
        return tickets[ticketId].status == TicketStatus.Sold && !eventCancelled;
    }

    /// A ticket owner cancels their own unused ticket before the event and is refunded from escrow.
    function cancelTicket(uint256 ticketId) external ticketExists(ticketId) eventNotCancelled {
        require(block.timestamp < eventEnd, "Event has already ended");
        Ticket storage t = tickets[ticketId];
        require(t.owner == msg.sender, "Only the ticket owner can cancel it");
        require(t.status == TicketStatus.Sold, "Only sold, unused tickets can be cancelled");
        uint256 refundAmount = t.purchasePrice;
        t.status = TicketStatus.Cancelled;
        heldFunds -= refundAmount;
        (bool sent, ) = msg.sender.call{value: refundAmount}("");
        require(sent, "Refund transfer failed");
        emit TicketCancelled(ticketId, msg.sender, refundAmount);
    }

    /// The organizer cancels the whole event. Ticket owners then claim their refunds from escrow.
    function cancelEvent() external onlyOrganizer eventNotCancelled {
        require(!proceedsWithdrawn, "Proceeds were already withdrawn");
        eventCancelled = true;
        emit EventCancelledAndRefunded();
    }

    function claimEventRefund(uint256 ticketId) external ticketExists(ticketId) {
        require(eventCancelled, "Event has not been cancelled");
        Ticket storage t = tickets[ticketId];
        require(t.owner == msg.sender, "Only the ticket owner can claim a refund");
        require(t.status == TicketStatus.Sold, "Ticket is not eligible for refund");
        uint256 refundAmount = t.purchasePrice;
        t.status = TicketStatus.Refunded;
        heldFunds -= refundAmount;
        (bool sent, ) = msg.sender.call{value: refundAmount}("");
        require(sent, "Refund transfer failed");
        emit TicketCancelled(ticketId, msg.sender, refundAmount);
    }

    /// After the event has ended (and was not cancelled), the organizer withdraws the held payments.
    function withdrawProceeds() external onlyOrganizer {
        require(!eventCancelled, "Event was cancelled; tickets are refunded instead");
        require(block.timestamp >= eventEnd, "Event has not ended yet");
        require(!proceedsWithdrawn, "Proceeds already withdrawn");
        uint256 amount = heldFunds;
        proceedsWithdrawn = true;
        heldFunds = 0;
        (bool sent, ) = organizer.call{value: amount}("");
        require(sent, "Withdrawal failed");
        emit ProceedsWithdrawn(organizer, amount);
    }

    function getTicketsOwnedBy(address ownerAddress) external view returns (uint256[] memory) {
        return ticketsOwnedBy[ownerAddress];
    }

    function getTicket(uint256 ticketId) external view ticketExists(ticketId) returns (Ticket memory) {
        return tickets[ticketId];
    }

    function getAllTickets() external view returns (Ticket[] memory) {
        Ticket[] memory allTickets = new Ticket[](ticketsIssued);
        for (uint256 i = 0; i < ticketsIssued; i++) {
            allTickets[i] = tickets[i];
        }
        return allTickets;
    }

    function _removeFromOwnedList(address ownerAddress, uint256 ticketId) internal {
        uint256[] storage owned = ticketsOwnedBy[ownerAddress];
        for (uint256 i = 0; i < owned.length; i++) {
            if (owned[i] == ticketId) {
                owned[i] = owned[owned.length - 1];
                owned.pop();
                break;
            }
        }
    }
}