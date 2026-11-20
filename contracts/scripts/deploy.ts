import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();

  const eventName = "PMP Live: Manila Night";
  // After this time the organizer can withdraw the held payments.
  // Use EVENT_END (ISO date) to change it, e.g. EVENT_END=2026-12-02T00:00:00+08:00
  const eventEnd = Math.floor(
    new Date(process.env.EVENT_END ?? "2026-12-02T00:00:00+08:00").getTime() / 1000
  );

  // tier numbers: 0 = General, 1 = Premium, 2 = VIP
  const tiers = [
    { name: "General", price: "0.01", count: 50 },
    { name: "Premium", price: "0.02", count: 30 },
    { name: "VIP", price: "0.03", count: 20 },
  ];
  const maxTickets = tiers.reduce((sum, t) => sum + t.count, 0);

  console.log(`Deploying EventTicket for "${eventName}"...`);
  const EventTicket = await ethers.getContractFactory("EventTicket");
  const eventTicket = await EventTicket.deploy(
    eventName,
    maxTickets,
    eventEnd,
    ethers.parseEther(tiers[0].price),
    ethers.parseEther(tiers[1].price),
    ethers.parseEther(tiers[2].price)
  );
  await eventTicket.waitForDeployment();

  const address = await eventTicket.getAddress();
  console.log(`✅ EventTicket deployed to: ${address}`);

  // Issue the tickets of each tier in batches of 25
  for (let tier = 0; tier < tiers.length; tier++) {
    let left = tiers[tier].count;
    while (left > 0) {
      const batch = Math.min(25, left);
      await (await eventTicket.issueTickets(tier, batch)).wait();
      left -= batch;
      await new Promise((resolve) => setTimeout(resolve, 10000));
      console.log(`   issued ${batch} ${tiers[tier].name} tickets`);
    }
  }
  console.log("Ticket IDs: General 0-49, Premium 50-79, VIP 80-99");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});