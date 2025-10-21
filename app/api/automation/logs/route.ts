// API Route: Get automation logs
import { NextRequest } from 'next/server';
import { getLogger } from '@/lib/automation-logger';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit');
    
    const logger = getLogger();
    const logs = logger.getLogs(limit ? parseInt(limit) : undefined);

    return Response.json({
      success: true,
      logs
    });

  } catch (error: any) {
    console.error('Get logs error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

