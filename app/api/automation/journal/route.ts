// API Route: Get trade journal entries
import { NextRequest } from 'next/server';
import { getJournal } from '@/lib/persistent-journal';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const aiNumber = searchParams.get('aiNumber');
    const limit = searchParams.get('limit');

    const journal = getJournal();
    
    console.log('[JOURNAL_API] Fetching journal entries...');

    if (aiNumber) {
      const num = parseInt(aiNumber);
      if (num < 1 || num > 6) {
        return Response.json(
          { success: false, error: 'Invalid AI number (must be 1-6)' },
          { status: 400 }
        );
      }

      const entries = journal.getEntries(num);
      const limitedEntries = limit ? entries.slice(-parseInt(limit)) : entries;
      return Response.json({ success: true, entries: limitedEntries });
    }

    // Return all journal entries
    const allEntries = journal.getAllEntries();
    const entriesObj: Record<number, any[]> = {};
    
    Object.entries(allEntries).forEach(([aiNum, entries]) => {
      entriesObj[parseInt(aiNum)] = limit ? entries.slice(-parseInt(limit)) : entries;
    });

    console.log('[JOURNAL_API] Returning entries for AIs:', Object.keys(entriesObj).join(', '));
    console.log('[JOURNAL_API] Total entries per AI:', Object.values(entriesObj).map(e => e.length).join(', '));

    return Response.json({
      success: true,
      entries: entriesObj
    });

  } catch (error: any) {
    console.error('Get journal error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

