# Send events to Last9 from Node.js apps

This project demonstrates how to send JSON events to Last9 using the OpenTelemetry OTLP HTTP exporter. The application runs in a continuous loop, sending events until interrupted by Ctrl-C.

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

## Environment Variables

### Required Variables
- `LAST9_ENDPOINT`: Your Last9 OTLP endpoint (without /v1/logs suffix)
- `LAST9_USER`: Last9 Username for basic auth 
- `LAST9_PASSWORD`: Last9 Password for basic auth

### Optional Variables
- `SERVICE_NAME`: Service name for telemetry (defaults to 'default-service')
- `EVENT_INTERVAL_MS`: Time interval between events in milliseconds (defaults to 1000ms)
- `MAX_EVENTS`: Maximum number of events to send before stopping (defaults to unlimited, use -1 for unlimited)

## Running the Example

### Local Development

**Basic usage (sends events every 1 second until Ctrl-C):**
```bash
node last9-events-emitter.js
```

**Custom interval (sends events every 500ms):**
```bash
EVENT_INTERVAL_MS=500 node last9-events-emitter.js
```

**Limited events (sends only 50 events):**
```bash
MAX_EVENTS=50 node last9-events-emitter.js
```

**Combined settings:**
```bash
EVENT_INTERVAL_MS=2000 MAX_EVENTS=100 node last9-events-emitter.js
```

### Using Docker
```bash
# Build the Docker image
docker build -t last9-events-dispatcher .

# Run with environment variables
docker run --env-file .env last9-events-dispatcher

# Or run with inline environment variables
docker run -e LAST9_ENDPOINT=your_last9_endpoint \
           -e LAST9_USER=your_user \
           -e LAST9_PASSWORD=your_password \
           -e SERVICE_NAME=events-nodejs-service \
           -e EVENT_INTERVAL_MS=2000 \
           -e MAX_EVENTS=100 \
           last9-events-dispatcher
```

## Stopping the Application

- Press `Ctrl-C` to gracefully stop the application
- The application will ensure all pending events are sent before shutting down
- If `MAX_EVENTS` is set, the application will automatically stop after reaching the limit

## Example Output

```
Starting event emitter loop...
Event interval: 1000ms
Max events: unlimited
Press Ctrl-C to stop

Event 1 sent at 2024-01-15T10:30:00.000Z
Event 2 sent at 2024-01-15T10:30:01.000Z
...
Event 10 sent at 2024-01-15T10:30:09.000Z
Error event 10 sent at 2024-01-15T10:30:09.000Z
...

Received SIGINT. Shutting down gracefully...
Shutdown complete.
```


You can create powerful log analytics dashboards using these events into Last9. The events are added in [physical index](https://last9.io/docs/physical-indexes/) named `events` in Last9.

https://www.loom.com/share/2767f6fa3ff9460c8374558f7ac3debe