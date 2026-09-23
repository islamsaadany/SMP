/* ONE WORD PER THING, IN TWO FORMS (§383)

   Islam set every description and default in chat and chose two boxes per
   row: `grp` now holds the word for ONE and `bu` the word for MANY. There is
   no group word and business-unit word any more; one word is used at the
   group, in every business unit and in every function. The COLUMNS keep their
   names (§30.2): a tab still open on the previous build posts `group`/`bu`,
   and a renamed field would have written NULL into both.

   What each existing row keeps, as agreed on the drawing:
     · The word a client typed for business-unit pages is kept, as the MANY.
       A row that only ever had a group word (Mission, Core Values, where the
       business-unit box read "—") keeps that word.
     · A word still sitting on the old shipped default moves to the new one
       ("Winning Aspiration" becomes "Winning Aspirations", "Mission" becomes
       "Missions"), because nobody chose it.
     · The ONE form is filled from the platform's default until somebody
       changes it. The old group-level words ("Vision") go, as agreed.
     · Capabilities get their own row. A client who had typed their own
       group word for the Pillars row ("Group capabilities" was the default)
       keeps it as the capabilities' word.
     · Division, Supporting Function and Project are added.
   Descriptions and the order are the platform's, so they are set for all.
   Written so a second run changes nothing. */
WITH d(idx, key, internal, one, many, note) AS (VALUES
  (0,'theme','Theme','Theme','Themes','The general motto or themes the whole company is following'),
  (1,'pillar','Pillar','Pillar','Pillars','A business unit''s direction or capability focus areas'),
  (2,'capability','Capability','Capability','Capabilities','The internal abilities built to achieve the strategic choices'),
  (3,'keyobj','Key Objective','Key Objective','Key Objectives','The targets set for a business unit, a company or the group'),
  (4,'aspiration','Winning Aspiration','Winning Aspiration','Winning Aspirations','A description of what success looks like'),
  (5,'purpose','Mission','Mission','Missions','Answering the question: why do we exist'),
  (6,'values','Core Values','Core Values','Core Values','The company culture elements'),
  (7,'measure','Key Measure','Key measure','Key measures','The measures under a single pillar'),
  (8,'tactic','Tactic','Tactic','Tactics','The work under a pillar: spans quarters and has an owner'),
  (9,'unitword','Business Unit','Business unit','Business units','A part of the business with a plan of its own'),
  (10,'division','Division','Division','Divisions','The layer between the company or group level and the units and functions'),
  (11,'fnword','Supporting Function','Supporting Function','Supporting Functions','The supporting functions that enable the strategy'),
  (12,'project','Project','Project','Projects','The group of activities with correlated timelines and outcomes')
)
INSERT INTO labels (tenant_id, key, idx, internal, grp, bu, note)
SELECT t.id, d.key, d.idx, d.internal, d.one,
       CASE WHEN d.key = 'capability'
             AND p.grp IS NOT NULL AND p.grp NOT IN ('', '—', 'Group capabilities', 'Pillar')
            THEN p.grp ELSE d.many END,
       d.note
  FROM tenants t CROSS JOIN d
  LEFT JOIN labels p ON p.tenant_id = t.id AND p.key = 'pillar'
ON CONFLICT (tenant_id, key) DO NOTHING;

UPDATE labels SET bu = grp WHERE bu IS NULL OR bu IN ('', '—');
UPDATE labels SET bu = 'Winning Aspirations' WHERE key = 'aspiration' AND bu = 'Winning Aspiration';
UPDATE labels SET bu = 'Missions' WHERE key = 'purpose' AND bu = 'Mission';

WITH d(idx, key, internal, one, many, note) AS (VALUES
  (0,'theme','Theme','Theme','Themes','The general motto or themes the whole company is following'),
  (1,'pillar','Pillar','Pillar','Pillars','A business unit''s direction or capability focus areas'),
  (2,'capability','Capability','Capability','Capabilities','The internal abilities built to achieve the strategic choices'),
  (3,'keyobj','Key Objective','Key Objective','Key Objectives','The targets set for a business unit, a company or the group'),
  (4,'aspiration','Winning Aspiration','Winning Aspiration','Winning Aspirations','A description of what success looks like'),
  (5,'purpose','Mission','Mission','Missions','Answering the question: why do we exist'),
  (6,'values','Core Values','Core Values','Core Values','The company culture elements'),
  (7,'measure','Key Measure','Key measure','Key measures','The measures under a single pillar'),
  (8,'tactic','Tactic','Tactic','Tactics','The work under a pillar: spans quarters and has an owner'),
  (9,'unitword','Business Unit','Business unit','Business units','A part of the business with a plan of its own'),
  (10,'division','Division','Division','Divisions','The layer between the company or group level and the units and functions'),
  (11,'fnword','Supporting Function','Supporting Function','Supporting Functions','The supporting functions that enable the strategy'),
  (12,'project','Project','Project','Projects','The group of activities with correlated timelines and outcomes')
)
UPDATE labels l SET grp = d.one, internal = d.internal, note = d.note, idx = d.idx
  FROM d WHERE l.key = d.key;
