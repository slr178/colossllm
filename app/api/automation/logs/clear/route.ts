// API Route: Clear all logs
import { getLogger } from '@/lib/automation-logger';

export async function POST() {
  try {
    const logger = getLogger();
    logger.clear();

    return Response.json({
      success: true,
      message: 'Logs cleared'
    });

  } catch (error: any) {
    console.error('Clear logs error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

