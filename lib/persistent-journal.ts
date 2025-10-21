// Persistent journal system that saves to disk
import fs from 'fs';
import path from 'path';
import { JournalEntry } from './ai-automation';

export interface StoredJournalEntry extends JournalEntry {
  aiNumber: number;
}

class PersistentJournal {
  private journalPath: string;
  private entries: Map<number, JournalEntry[]> = new Map();
  private maxEntriesPerAI = 100;
  private saveDebounceTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.journalPath = path.join(process.cwd(), 'logs', 'journal.json');
    this.loadJournal();
  }

  private loadJournal() {
    try {
      // Ensure logs directory exists
      const logsDir = path.dirname(this.journalPath);
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }

      if (fs.existsSync(this.journalPath)) {
        const data = fs.readFileSync(this.journalPath, 'utf-8');
        const storedEntries: StoredJournalEntry[] = JSON.parse(data);
        
        // Group by AI number
        this.entries.clear();
        for (const entry of storedEntries) {
          const aiNumber = entry.aiNumber;
          const { aiNumber: _, ...journalEntry } = entry;
          
          if (!this.entries.has(aiNumber)) {
            this.entries.set(aiNumber, []);
          }
          this.entries.get(aiNumber)!.push(journalEntry);
        }
        
        console.log(`[JOURNAL] Loaded ${storedEntries.length} entries from disk`);
      }
    } catch (error) {
      console.error('[JOURNAL] Failed to load journal:', error);
      this.entries.clear();
    }
  }

  private debouncedSave() {
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    
    this.saveDebounceTimer = setTimeout(() => {
      this.saveJournal();
    }, 1000); // Save after 1 second of no new entries
  }

  private saveJournal() {
    try {
      const storedEntries: StoredJournalEntry[] = [];
      
      // Flatten all entries with AI numbers
      for (const [aiNumber, entries] of this.entries) {
        for (const entry of entries) {
          storedEntries.push({ ...entry, aiNumber });
        }
      }
      
      // Sort by timestamp
      storedEntries.sort((a, b) => a.timestamp - b.timestamp);
      
      // Keep only recent entries (last 500 total)
      const recentEntries = storedEntries.slice(-500);
      
      fs.writeFileSync(this.journalPath, JSON.stringify(recentEntries, null, 2));
      console.log(`[JOURNAL] Saved ${recentEntries.length} entries to disk`);
    } catch (error) {
      console.error('[JOURNAL] Failed to save journal:', error);
    }
  }

  addEntry(aiNumber: number, entry: Omit<JournalEntry, 'timestamp'>) {
    const fullEntry: JournalEntry = {
      timestamp: Date.now(),
      ...entry
    };
    
    if (!this.entries.has(aiNumber)) {
      this.entries.set(aiNumber, []);
    }
    
    const aiEntries = this.entries.get(aiNumber)!;
    aiEntries.push(fullEntry);
    
    // Keep only last N entries per AI
    if (aiEntries.length > this.maxEntriesPerAI) {
      this.entries.set(aiNumber, aiEntries.slice(-this.maxEntriesPerAI));
    }
    
    console.log(`[JOURNAL] Added ${entry.type} for AI${aiNumber}. Total: ${aiEntries.length}`);
    
    // Save to disk
    this.debouncedSave();
  }

  getEntries(aiNumber: number): JournalEntry[] {
    return this.entries.get(aiNumber) || [];
  }

  getAllEntries(): { [aiNumber: number]: JournalEntry[] } {
    const result: { [aiNumber: number]: JournalEntry[] } = {};
    
    for (const [aiNumber, entries] of this.entries) {
      result[aiNumber] = entries;
    }
    
    return result;
  }

  clearEntries(aiNumber?: number) {
    if (aiNumber !== undefined) {
      this.entries.delete(aiNumber);
    } else {
      this.entries.clear();
    }
    this.debouncedSave();
  }
}

// Singleton instance
let journalInstance: PersistentJournal | null = null;

export function getJournal(): PersistentJournal {
  if (!journalInstance) {
    journalInstance = new PersistentJournal();
  }
  return journalInstance;
}
