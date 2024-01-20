## Lighthouse Batch Reporter Api

Docker containerised Lighthouse API that allows the creation of lighthouse reports.
This is a very simple Express API that relies on the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse) utility by Google.
In simple words, a headless chromium instance is spun up inside the container, and is controlled via Lighthouse CLI to generate reports on a given website.

See:

- [Installation](#installation)
- [Getting Started](#getting-started)

> Partially based on: Mike Stead's [Lighthouse Batch Reporter](https://github.com/mikestead/lighthouse-batch)

## Installation

Install the application with the following command inside the root dir: 
```shell
make install
```

This will build the docker container, and automatically spin it up. 

The application will be accessible at `http://localhost:3000`

## Getting Started

Run the application with the following command inside the root dir:

```shell
make up
```

### Example

```http
POST http://localhost:3000/api/mobile/run-audit
Content-Type: application/json

{
  "siteUrl": "https://phobosmedia.com"
}
```

Response:
```json
[
  {
    "url": "http://phobosmedia.com/",
    "name": "phobosmedia_com_",
    "score": 0.79,
    "detail": {
      "performance": 0.85,
      "accessibility": 0.98,
      "best-practices": 0.81,
      "seo": 1,
      "pwa": 0.29
    }
  }
]
```

### Endpoints
- `/api/mobile/run-audit`
- `/api/desktop/run-audit`

## Notices
Chrome is run with the following flags to support the widest set of execution
  environments, including docker containers
  `--chrome-flags="--no-sandbox --headless --disable-gpu"`. You can replace
  these with your own by passing `--chrome-flags` as extra parameters. e.g.

  `--params "--chrome-flags=\"--no-sandbox --disable-gpu\""`
