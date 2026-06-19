---
"@isorouter/core": patch
---

Guard the route matcher against malformed percent-encoding. A pathname segment
containing an invalid escape — a lone `%`, bad hex digits, or invalid UTF-8 byte
sequences — previously threw `URIError` from `decodeURIComponent` mid-match and
aborted the navigation. Such segments now fall back to their raw value, so
matching always resolves to a route or `null` and never crashes.
