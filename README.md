# Montana Contracting

Static portfolio website for [Montana Contracting](https://montanacontracting.com).

## Local development

```sh
npm start
```

The site is available at `http://localhost:4173`. The local server serves only the generated public directory and does not send email. Run `npm test` to check inquiry validation and form states with a fake mail transport, project pages, galleries, mobile navigation, page metadata, scripts, and assets.

Open `http://localhost:4173/?intro=preview` to check the M opening with Replay opening and Slow replay controls. These controls appear only on localhost or 127.0.0.1. Normal visits play the opening once per session; direct section links and reduced-motion settings skip it.

Edit `data/projects.json` for project content, then run `npm run build` to regenerate project pages and the public directory. Do not edit generated project HTML directly.

## Deployment

Vercel runs `npm run build`, publishes `public`, and builds `api/inquiry.js` as a server function. The site uses `/pre-construction/` and `/projects/<slug>/` routes. The old root `pre-construction.html` remains in Git but is not published.

Production project: `montana-contracting-com` in the NOVA team. Its server-only settings are `RESEND_API_KEY` and `INQUIRY_FROM`. The recipient is fixed to matt@montanacontracting.com. Never commit credentials. See `docs/release.md` for source mapping and release gates.
