import { IncomingHttpHeaders } from "http";

// Node's http module type for incoming headers is incompatible with the fetch spec due to alternative handling of duplicate headers
// Handled automatically by libraries like axios, but conversion is not cumbersome
const toFetchHeaders = (headers: IncomingHttpHeaders): HeadersInit => {
  const fetchHeaders: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      // If the header has multiple values, join to comma-separated list
      fetchHeaders[key] = value.join(", ");
    } else if (value !== undefined) {
      fetchHeaders[key] = value;
    }
    // Note: If value is undefined, it's omitted, as fetch does not allow undefined header values
  });
  return fetchHeaders;
};

export default toFetchHeaders;
