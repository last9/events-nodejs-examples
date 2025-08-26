require('dotenv').config();

const {
  LoggerProvider,
  BatchLogRecordProcessor,
  SimpleLogRecordProcessor,
} = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-http');
const { defaultResource, resourceFromAttributes } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');
const { SeverityNumber } = require('@opentelemetry/api-logs');

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
      [ATTR_SERVICE_NAME]: serviceName,
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
  const logger = loggerProvider.getLogger('last9-events-logger', '1.0.0');

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
    "__last9event__": true
  };

  // Log your event data with __last9event__ flag
  
  // Emit log
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: JSON.stringify(sampleEvent),
    attributes: {
      'user.id': sampleEvent.id,
      'user.email': sampleEvent.email,
      'account.type': sampleEvent.accountType,
      '__last9event__': 'true'
    },
  });

  const errorEvent = {
    "id": "usr_002",
    "email": "john.doe@email.com",
    "operation": "login",
    "error": "Invalid credentials",
    "__last9event__": true
  };

  // Another example with error severity
  
  // Emit error log
  logger.emit({
    severityNumber: SeverityNumber.ERROR,
    severityText: 'ERROR',
    body: JSON.stringify(errorEvent),
    attributes: {
      'user.id': errorEvent.id,
      'operation': errorEvent.operation,
      'error': errorEvent.error,
      '__last9event__': 'true'
    },
  });

  // Important: Force flush and shutdown to ensure logs are sent
  await loggerProvider.forceFlush();
  await loggerProvider.shutdown();
}

if (require.main === module) {
  main().catch(console.error);
}