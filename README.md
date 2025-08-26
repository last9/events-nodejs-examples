# Last9 Events Logger for Node.js

This project demonstrates how to send JSON events to Last9 using the OpenTelemetry OTLP HTTP exporter.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your Last9 credentials and endpoint
```

## Usage

```javascript
require('dotenv').config(); // Load environment variables
const { Last9Logger } = require('./logger');

const logger = new Last9Logger();

const eventData = {
  "id": "usr_001",
  "email": "user@email.com",
  "operation": "signup",
  "__last9event__": true  // Required key
};

logger.logEvent(eventData, 'INFO');

// Don't forget to shutdown
await logger.shutdown();
```

## Environment Variables

- `LAST9_ENDPOINT`: Your Last9 OTLP endpoint (without /v1/logs suffix)
- `LAST9_USER`: Last9 Username for basic auth 
- `LAST9_PASSWORD`: Last9 Password for basic auth
- `SERVICE_NAME`: Service name for telemetry (defaults to 'default-service')

## Running the Example

### Local Development
```bash
node last9-logger.js
```

### Using Docker
```bash
# Build the Docker image
docker build -t last9-events-dispatcher .

# Run with environment variables
docker run --env-file .env last9-logger

# Or run with inline environment variables
docker run -e LAST9_ENDPOINT=your_last9_endpoint \
           -e LAST9_USER=your_user \
           -e LAST9_PASSWORD=your_password \
           -e SERVICE_NAME=events-nodejs-service \
           last9-events-dispatcher

```

