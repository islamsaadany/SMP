-- 003 · Simple SMO access (2026-08-20, Islam's instruction: "don't ask me to
-- do new passwords now on the app, just let me access with SMO and 1234").
--
-- The identity work in 002 stands — real sessions, hashed passwords, the SMO
-- issuing credentials to other people, and those issued passwords still forcing
-- a change on first use. What this migration removes is the forced change for
-- the SMO's OWN account, so getting into the deployed product is one step.
--
-- It runs once, recorded in _sql_migrations, because the deployed database was
-- already seeded with the old starting credential (4123, must-change) and code
-- alone would never reach that existing row. Being once-only is what stops it
-- clobbering a real password later: change the SMO password from inside the
-- product and this migration never runs again.
--
-- Deliberate and stated: 1234 is a weak password on a product reachable from
-- the internet. It is a demo convenience, recorded in §19.4 of the decisions
-- document, and it should be replaced before anything client-confidential goes
-- in. The hash below is scrypt with its own salt — the password itself is not
-- stored anywhere.

-- GUARDED ON THE TENANT IT WAS WRITTEN FOR (spec 030, 2026-08-28).
-- Since the platform holds a schema per client, this file runs on every client
-- created from now on — and unguarded it would put a known password on the
-- door of a database that has no people in it at all. The WHERE EXISTS makes
-- it apply to a tenant that already has an `smo` person and to nothing else.
-- The existing tenant recorded this migration long ago, so nothing there moves.
INSERT INTO credentials (person_key, password_hash, must_change)
SELECT 'smo', 's1:0cfbcab26f3ef15b45f5ed3694570ca9:aecd9a53399f62739636f1be57b724ec1ea1823074a03f6247eddcad21030266', false
WHERE EXISTS (SELECT 1 FROM people WHERE key = 'smo')
ON CONFLICT (person_key) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      must_change   = false,
      updated_at    = now();
