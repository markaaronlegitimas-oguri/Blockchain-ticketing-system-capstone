require('dotenv').config();
const { ethers } = require('ethers');
const abi = require('./EventTicket.json').abi;

(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const c = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, provider);
  console.log('address     :', process.env.CONTRACT_ADDRESS);
  console.log('organizer   :', await c.organizer());
  console.log('issued      :', (await c.ticketsIssued()).toString());
  const prices = await c.getTierPrices();
  console.log('tier prices :', prices.map((p) => ethers.formatEther(p)).join(' / '), 'ETH');
  const t = await c.getTicket(80);
  console.log('ticket #80  : tier', Number(t.tier), 'seat', Number(t.seat), 'status', Number(t.status));
})();