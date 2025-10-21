// API Route: Start AI automation
import { NextRequest } from 'next/server';
import { startAIAutomation, startAllAIAutomation } from '@/lib/ai-automation';
import { registerShutdownHandlers } from '@/lib/shutdown-handler';

// Register shutdown handlers once when the module loads
let handlersRegistered = false;
if (!handlersRegistered) {
  registerShutdownHandlers();
  handlersRegistered = true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { aiNumber, intervalMinutes = 5, startAll = false } = body;

    if (startAll) {
      await startAllAIAutomation(intervalMinutes);
      return Response.json({
        success: true,
        message: 'Started automation for all AIs',
        intervalMinutes
      });
    }

    if (!aiNumber || aiNumber < 1 || aiNumber > 6) {
      return Response.json(
        { success: false, error: 'Invalid AI number (must be 1-6)' },
        { status: 400 }
      );
    }

    await startAIAutomation(aiNumber, intervalMinutes);

    return Response.json({
      success: true,
      message: `Started automation for AI${aiNumber}`,
      aiNumber,
      intervalMinutes
    });

  } catch (error: any) {
    console.error('Start automation error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

