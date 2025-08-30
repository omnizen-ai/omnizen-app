import { LangfuseSpanProcessor } from "@langfuse/otel";
import { NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { registerInstrumentations } from "@opentelemetry/instrumentation";

export function register() {
  // Create Langfuse span processor with filtering for Next.js infrastructure spans
  const langfuseSpanProcessor = new LangfuseSpanProcessor({
    // Filter out Next.js infrastructure spans to reduce noise
    shouldExportSpan: (span) => {
      const scope = span.otelSpan.instrumentationScope.name;
      // Only export AI SDK and custom spans, skip Next.js internal spans
      return scope !== "next.js" && scope !== "@opentelemetry/instrumentation-http";
    }
  });

  // Create and configure the tracer provider
  const tracerProvider = new NodeTracerProvider({
    spanProcessors: [langfuseSpanProcessor],
  });

  // Register the tracer provider globally
  tracerProvider.register();

  // Register auto-instrumentations if needed
  registerInstrumentations({
    instrumentations: [],
  });

  console.log("Langfuse tracing initialized");
}