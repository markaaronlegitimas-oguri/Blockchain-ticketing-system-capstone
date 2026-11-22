import { useCallback, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../wallet/WalletProvider';

export interface ContractState {
  eventCancelled: boolean;
  proceedsWithdrawn: boolean;
  eventEnd: number; // unix seconds
  heldFunds: string; // ETH
  organizer: string;
  account: string;
  isOrganizer: boolean;
}

/** Reads the event status straight from the smart contract. */
export function useContractState() {
  const { contract } = useWallet();
  const [state, setState] = useState<ContractState | null>(null);

  const reload = useCallback(async () => {
    if (!contract) {
      setState(null);
      return;
    }
    try {
      const c: any = contract;
      const [eventCancelled, proceedsWithdrawn, eventEnd, heldFunds, organizer, account] = await Promise.all([
        c.eventCancelled(),
        c.proceedsWithdrawn(),
        c.eventEnd(),
        c.heldFunds(),
        c.organizer(),
        c.signer.getAddress(),
      ]);
      setState({
        eventCancelled,
        proceedsWithdrawn,
        eventEnd: Number(eventEnd.toString()),
        heldFunds: ethers.utils.formatEther(heldFunds),
        organizer,
        account,
        isOrganizer: String(organizer).toLowerCase() === String(account).toLowerCase(),
      });
    } catch {
      setState(null);
    }
  }, [contract]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { state, reload };
}