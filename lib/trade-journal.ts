// Trade Journal - Records all AI trading decisions

interface JournalEntry {
  timestamp: number;
  aiNumber: number;
  type: 'BNB_BUY' | 'ASTER_LONG' | 'ASTER_SHORT' | 'ASTER_CLOSE' | 'DECISION' | 'ERROR';
  symbol?: string;
  decision?: string;
  reasoning?: string;
  amount?: number;
  leverage?: number;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  confidence?: number;
  result?: string;
  txHash?: string;
  orderId?: string;
}

class TradeJournal {
  private entries: Map<number, JournalEntry[]> = new Map();
  private maxEntriesPerAI = 100;

  addEntry(aiNumber: number, entry: Omit<JournalEntry, 'timestamp' | 'aiNumber'>) {
    if (!this.entries.has(aiNumber)) {
      this.entries.set(aiNumber, []);
    }

    const fullEntry: JournalEntry = {
      timestamp: Date.now(),
      aiNumber,
      ...entry
    };

    const aiEntries = this.entries.get(aiNumber)!;
    aiEntries.push(fullEntry);

    // Keep only last N entries per AI
    if (aiEntries.length > this.maxEntriesPerAI) {
      this.entries.set(aiNumber, aiEntries.slice(-this.maxEntriesPerAI));
    }

    // Debug log
    console.log(`[JOURNAL] Added entry for AI${aiNumber}: ${entry.type} - Total entries: ${aiEntries.length}`);
  }

  getEntries(aiNumber: number, limit?: number): JournalEntry[] {
    const entries = this.entries.get(aiNumber) || [];
    if (limit) {
      return entries.slice(-limit);
    }
    return entries;
  }

  getAllEntries(): Map<number, JournalEntry[]> {
    return this.entries;
  }

  clear(aiNumber?: number) {
    if (aiNumber) {
      this.entries.delete(aiNumber);
    } else {
      this.entries.clear();
    }
  }
}

// Singleton
const journalInstance = new TradeJournal();

export function getJournal(): TradeJournal {
  return journalInstance;
}

export type { JournalEntry };

