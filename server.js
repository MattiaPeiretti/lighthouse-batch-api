const express = require('express');
const execute = require("./index");

const app = express();
app.use(express.json());


app.post("/api/mobile/run-audit", (request, response) => {
    const report = execute({sites: [request.body.siteUrl]})

    response.json(report);
});

app.post("/api/desktop/run-audit", (request, response) => {
    const report = execute({sites: [request.body.siteUrl]}, true)

    response.json(report);
});


app.listen(3000, () => {
    console.log(`Example app listening on port ${3000}`)
})
