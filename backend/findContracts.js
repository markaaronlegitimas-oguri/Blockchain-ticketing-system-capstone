require('dotenv').config();
const { ethers } = require('ethers');
const abi = require('./EventTicket.json').abi;

(async () => {
  const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  const wallet = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY);
  console.log('organizer:', wallet.address);
  const count = await provider.getTransactionCount(wallet.address);
  for (let n = 0; n < count; n++) {
    const addr = ethers.getCreateAddress({ from: wallet.address, nonce: n });
    const code = await provider.getCode(addr);
    if (code !== '0x') {
      const c = new ethers.Contract(addr, abi, provider);
      let issued = '?';
      try { issued = (await c.ticketsIssued()).toString(); } catch (_) {}
      console.log('nonce', n, '| contract', addr, '| tickets issued:', issued);
    }
  }
})();