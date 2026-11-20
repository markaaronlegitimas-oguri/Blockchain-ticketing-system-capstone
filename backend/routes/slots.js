// routes/slots.js
// Slot/Seat Selection (Requirement j): browse sessions + slot availability,
// and reserve a slot before completing the on-chain ticket purchase.
// Drop into backend/routes/slots.js

const express = require('express');
const supabase = require('../supabaseClient');
const { requireAuth } = require('../middleware/auth');
const { ethers } = require('ethers');
const contractArtifact = require('../EventTicket.json');
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const chain = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractArtifact.abi, provider);
const STATUS_NAMES = ['available', 'sold', 'used', 'cancelled', 'refunded'];
const router = express.Router();

// GET /api/events/:eventId/sessions
// List all sessions (showtimes) for an event.
router.get('/events/:eventId/sessions', async (req, res) => {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('id, session_name, starts_at, ends_at')
      .eq('event_id', req.params.eventId)
      .order('starts_at', { ascending: true });

    if (error) throw error;
    res.json({ sessions });
  } catch (error) {
    console.error('[GET /sessions]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sessions/:sessionId/slots
// List all slots (ticket tiers) for a session, with real-time availability.
router.get('/sessions/:sessionId/slots', async (req, res) => {
  try {
    const { data: slots, error } = await supabase
      .from('slots')
      .select('id, slot_name, price, capacity, tier')
      .eq('session_id', req.params.sessionId);

    if (error) throw error;

    // Attach a live "available" count to each slot
    const withAvailability = await Promise.all(
      slots.map(async (slot) => {
        const { data: available, error: availError } = await supabase
          .rpc('slot_available_count', { p_slot_id: slot.id });

        return {
          ...slot,
          available: availError ? null : available,
        };
      })
    );

    res.json({ slots: withAvailability });
  } catch (error) {
    console.error('[GET /slots]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/slots/:slotId/book
// Reserve one unit of a slot for the logged-in user. Creates a "pending"
// booking that expires in 10 minutes unless confirmed (see sql file).
// This is meant to run BEFORE the on-chain purchase, so the slot is held
// while the attendee completes payment via MetaMask.
router.post('/slots/:slotId/book', requireAuth, async (req, res) => {
  const { slotId } = req.params;
  const userId = req.user.id;

  try {
    // Re-check availability right before booking (avoids race conditions
    // where two people click "book" on the last seat at the same time)
    const { data: available, error: availError } = await supabase
      .rpc('slot_available_count', { p_slot_id: slotId });

    if (availError) throw availError;
    if (available === null || available <= 0) {
      return res.status(409).json({ error: 'This slot is fully booked.' });
    }

    const { data: booking, error } = await supabase
      .from('bookings')
      .insert({ slot_id: slotId, user_id: userId, status: 'pending' })
      .select('id, slot_id, status, expires_at')
      .single();

    if (error) throw error;

    const { data: slotRow } = await supabase
      .from('slots').select('tier').eq('id', slotId).single();

    res.status(201).json({
      message: 'Slot reserved. Complete your purchase within 10 minutes.',
      booking,
      tier: slotRow?.tier ?? 0,
    });
  } catch (error) {
    console.error('[POST /book]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/bookings/:bookingId/confirm
// Marks a booking as confirmed and links it to the ticket created after
// the on-chain purchase succeeds. Call this right after your existing
// /api/tickets/verify-purchase route completes.
router.post('/bookings/:bookingId/confirm', requireAuth, async (req, res) => {
  const { bookingId } = req.params;
  const { ticketId } = req.body;

  if (!ticketId) {
    return res.status(400).json({ error: 'ticketId is required' });
  }

  try {
    const { data: booking, error: findError } = await supabase
      .from('bookings')
      .select('id, user_id, status, expires_at')
      .eq('id', bookingId)
      .single();

    if (findError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.user_id !== req.user.id) {
      return res.status(403).json({ error: 'This booking does not belong to you' });
    }
    if (booking.status !== 'pending') {
      return res.status(409).json({ error: `Booking is already ${booking.status}` });
    }
    if (new Date(booking.expires_at) < new Date()) {
      return res.status(409).json({ error: 'Booking has expired' });
    }

    const { data: updated, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed', ticket_id: ticketId })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ message: 'Booking confirmed', booking: updated });
  } catch (error) {
    console.error('[POST /confirm]', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sessions/:sessionId/seat-map
// Seat map for every logged-in role (attendee, staff, organizer, admin).
router.get('/sessions/:sessionId/seat-map', requireAuth, async (req, res) => {
  try {
    const { data: slots, error } = await supabase
      .from('slots')
      .select('id, slot_name, price, capacity, tier')
      .eq('session_id', req.params.sessionId)
      .order('tier', { ascending: true });
    if (error) throw error;

    const all = await chain.getAllTickets();
    const tiers = [];
    for (const slot of slots) {
      const seats = all
        .filter((t) => Number(t.tier) === slot.tier)
        .map((t) => ({
          seat: Number(t.seat),
          ticketId: Number(t.id),
          status: STATUS_NAMES[Number(t.status)],
        }))
        .sort((a, b) => a.seat - b.seat);

      // seats currently being paid for (10-minute holds) are shown as reserved
      const { count } = await supabase
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('slot_id', slot.id)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());
      let toReserve = count || 0;
      for (const s of seats) {
        if (toReserve > 0 && s.status === 'available') { s.status = 'reserved'; toReserve--; }
      }

      tiers.push({ slotId: slot.id, name: slot.slot_name, tier: slot.tier,
                   price: slot.price, capacity: slot.capacity, seats });
    }
    res.json({ tiers });
  } catch (error) {
    console.error('[GET /seat-map]', error.message);
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;