# Get Happy Certified (videographer onboarding)

Live at https://onboarding.happyproductions.video/certified/ (same Cloudflare Pages project as the client onboarding; the build output directory is `onboarding`).

Send it to every videographer a client has approved. Personalize the link:

    https://onboarding.happyproductions.video/certified/?name=Miranda%20Lopez&shoot=Lions%20Antigua%20Nov%2014&client=Gail

- `name` prefills their name ("You're in, Miranda.")
- `shoot` prefills the shoot
- `client` is the client contact's first name used in the handshake script ("Hi Gail, I'm Miranda from Happy Productions…"); defaults to Maria
- add `test` to click through on the live site without sending anything

## Flow
Welcome (voice guided or self-guided) → About you → Get paid → Pay terms → Get certified (optional) → Happy Pledge (9 promises) → Sign → Your kit (tee size + shipping) → All set.

## Where the data goes
- **Payment details + the four "I will only be paid if…" confirmations** post to the existing Google Form "How to get paid for Happy Productions" (`formResponse`, same entry IDs), so they land in the same responses sheet as before. Bank fields are never written to the browser's storage.
- **Contact, pledge, signature, tee size and shipping address** post to `CREW_HOOK` (Airtable webhook, "Happy Certified Crew" table in the Happy Collective – Videographers base). `CREW_HOOK` is empty until that automation is switched on.
- Nothing is sent anywhere except on `onboarding.happyproductions.video` (previews and `?test` show a "Preview" banner).

## Voice
`vo/*.mp3` are ElevenLabs `eleven_v4`, voice Jessica. Word timings are inlined as `CUES` in index.html for the captions.
