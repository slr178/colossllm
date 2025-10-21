// API Route: Get automation status
import { NextRequest } from 'next/server';
import { getAIStatus, getAllAIStatus, getAggregatedStats, getAllJournals } from '@/lib/ai-automation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const aiNumber = searchParams.get('aiNumber');
    const includeJournal = searchParams.get('includeJournal') === 'true';

    if (aiNumber) {
      const num = parseInt(aiNumber);
      if (num < 1 || num > 6) {
        return Response.json(
          { success: false, error: 'Invalid AI number (must be 1-6)' },
          { status: 400 }
        );
      }

      const status = getAIStatus(num);
      const response: any = { success: true, status };
      
      if (includeJournal) {
        response.journal = getAllJournals()[num] || [];
      }
      
      return Response.json(response);
    }

    // Return all AI statuses and aggregated stats
    const allStatuses = await getAllAIStatus();
    const aggregatedStats = getAggregatedStats(allStatuses);
    const journals = getAllJournals();

    return Response.json({
      success: true,
      statuses: allStatuses,
      aggregated: aggregatedStats,
      journals: journals
    });

  } catch (error: any) {
    console.error('Get status error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

