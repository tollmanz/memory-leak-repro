## Reproduce

1. `nvm use` (if using `nvm`)
1. `npm i`
1. `npm run start:dd`
1. Open separate terminal window
1. `curl http://localhost:3000/gc`
1. `curl "http://localhost:3000/big-response?request-type=request-promise-native&use-agent-with-keep-alive=yes"`
1. Run this command 4 times
1. `curl http://localhost:3000/gc`
1. `curl http://localhost:3000/heapdump`
1. Load the heap dump in Chrome DevTools
1. Look for `DatadogSpanContext` in the heap dump. You should see a lot of the hanging around
1. Look for the long `aaaaa...` string in the `(string)` constructor. This shows that the memory is
not being garbage collected

Feel free to run this same test with `request-type=got` to see similar results, suggesting it's more
of a keepalive issue than a request library issue.

Repeat these same steps, but use `use-agent-with-keep-alive=no` to turn off the keepalive agent. You
should see that the memory is garbage collected in the heap dump that you create.
