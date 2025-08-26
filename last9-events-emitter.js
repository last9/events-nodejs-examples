require('dotenv').config();

const {
  LoggerProvider,
  BatchLogRecordProcessor,
} = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { defaultResource, resourceFromAttributes } = require('@opentelemetry/resources');

async function main() {
  const endpoint = process.env.LAST9_ENDPOINT;
  const serviceName = process.env.SERVICE_NAME || 'default-service';
  const headers = {};
  
  if (!endpoint) {
    throw new Error('LAST9_ENDPOINT environment variable is required');
  }

  if (process.env.LAST9_USER && process.env.LAST9_PASSWORD) {
    const auth = Buffer.from(`${process.env.LAST9_USER}:${process.env.LAST9_PASSWORD}`).toString('base64');
    headers['Authorization'] = `Basic ${auth}`;
  }

  // Configure OTLP exporter for Last9

  // Create resource
  const resource = defaultResource().merge(
    resourceFromAttributes({
      ['service.name']: serviceName,
    })
  );

  // Create exporter
  const logExporter = new OTLPLogExporter({
    url: `${endpoint}/v1/logs`,
    headers,
  });

  // Create logger provider with processor
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor(logExporter)]
  });

  // Get logger from provider
  const logger = loggerProvider.getLogger('last9-events-emitter', '1.0.0');

  // Sample event data
  const sampleEvent = {
    "id": "usr_001",
    "email": "sarah.martinez@email.com",
    "firstName": "Sarah",
    "lastName": "Martinez",
    "username": "sarahm_92",
    "phoneNumber": "+1-555-0147",
    "dateOfBirth": "1992-05-14",
    "signUpDate": "2025-08-20T14:32:18Z",
    "country": "United States",
    "city": "Austin",
    "zipCode": "73301",
    "isVerified": true,
    "accountType": "premium",
    "__last9event__": 'true' // This is a flag to indicate that this is a event to be sent to Last9
  };

  const errorEvent = {
    "id": "usr_002",
    "email": "john.doe@email.com",
    "operation": "login",
    "error": "Invalid credentials",
    "__last9event__": 'true'
  };

  // Set up signal handlers for graceful shutdown
  let isShuttingDown = false;
  
  const gracefulShutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    isShuttingDown = true;
    
    try {
      // Force flush and shutdown to ensure logs are sent
      await loggerProvider.forceFlush();
      await loggerProvider.shutdown();
      console.log('Shutdown complete.');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle different termination signals
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  // Configuration for the event loop
  const eventInterval = parseInt(process.env.EVENT_INTERVAL_MS) || 1000; // Default 1 second
  const maxEvents = parseInt(process.env.MAX_EVENTS) || -1; // -1 means unlimited
  
  console.log(`Starting event emitter loop...`);
  console.log(`Event interval: ${eventInterval}ms`);
  console.log(`Max events: ${maxEvents === -1 ? 'unlimited' : maxEvents}`);
  console.log(`Press Ctrl-C to stop\n`);

  let eventCount = 0;
  const startTime = Date.now();

  // Main event loop
  while (!isShuttingDown && (maxEvents === -1 || eventCount < maxEvents)) {
    try {
      // Generate a unique event ID for each iteration
      const currentEvent = {
        ...sampleEvent,
        id: `usr_${String(eventCount + 1).padStart(3, '0')}`,
        timestamp: new Date().toISOString(),
        eventNumber: eventCount + 1,
        uptime: Date.now() - startTime
      };

      // Emit the event
      logger.emit({
        attributes: currentEvent,
      });

      eventCount++;
      console.log(`Event ${eventCount} sent at ${new Date().toISOString()}`);

      // Occasionally send an error event (every 10th event)
      if (eventCount % 10 === 0) {
        const currentErrorEvent = {
          ...errorEvent,
          id: `err_${String(eventCount).padStart(3, '0')}`,
          timestamp: new Date().toISOString(),
          eventNumber: eventCount,
          uptime: Date.now() - startTime
        };

        logger.emit({
          attributes: currentErrorEvent,
        });
        console.log(`Error event ${eventCount} sent at ${new Date().toISOString()}`);
      }

      // Wait for the specified interval
      await new Promise(resolve => setTimeout(resolve, eventInterval));

    } catch (error) {
      console.error(`Error sending event ${eventCount + 1}:`, error);
      // Continue the loop even if there's an error
      await new Promise(resolve => setTimeout(resolve, eventInterval));
    }
  }

  // If we reach here, it means we've hit the max events limit
  if (maxEvents !== -1 && eventCount >= maxEvents) {
    console.log(`\nReached maximum events limit (${maxEvents}). Shutting down...`);
  }

  // Graceful shutdown
  await gracefulShutdown('MAX_EVENTS_REACHED');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };