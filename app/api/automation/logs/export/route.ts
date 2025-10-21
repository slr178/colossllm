// API Route: Export logs as JSON file
import { getLogger } from '@/lib/automation-logger';

export async function GET() {
  try {
    const logger = getLogger();
    const logsJson = logger.export();

    return new Response(logsJson, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="automation-logs-${Date.now()}.json"`
      }
    });

  } catch (error: any) {
    console.error('Export logs error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

