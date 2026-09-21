PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0001_admin.sql','2026-09-17 11:23:19');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(2,'0002_password_links.sql','2026-09-18 09:16:57');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(3,'0003_account_lock.sql','2026-09-18 11:50:57');
CREATE TABLE admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'editor')),
  password_hash TEXT NOT NULL,
  must_change   INTEGER NOT NULL DEFAULT 0,
  totp_secret   TEXT,            
  totp_pending  TEXT,            
  totp_last     INTEGER NOT NULL DEFAULT 0,  
  disabled      INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL,
  updated_at    INTEGER NOT NULL
, failed_logins INTEGER NOT NULL DEFAULT 0, locked INTEGER NOT NULL DEFAULT 0);
INSERT INTO "admins" ("id","email","name","role","password_hash","must_change","totp_secret","totp_pending","totp_last","disabled","created_at","updated_at","failed_logins","locked") VALUES(1,'siddharth.devnani@socheers.net','Siddharth','owner','pbkdf2$100000$hrmBLOHr5IsWe3mUyAud1Q$LlC0UQQZimV_j6ak2Kdb1R-r0n9B4pfhFgU5RVMAXaU',0,NULL,'v1.0wyr3LQfbjGE_yjU.dPPMGe50AxXNaqKKE1nTk7Hauk9a5BSpaqaqRU2Jv-QAFr754uQXgwAY3kuDB0PA',0,0,1789645314331,1789645314331,0,0);
INSERT INTO "admins" ("id","email","name","role","password_hash","must_change","totp_secret","totp_pending","totp_last","disabled","created_at","updated_at","failed_logins","locked") VALUES(2,'veeransh@fiaxe.com','Veeransh','owner','pbkdf2$100000$xmyCvGCWLKQjt348i6AWtg$Mwo0Kx4ORwK13WkK933rYfHOFbvZhEZyTi0VEhu8Py8',0,'v1.5bs0kM8FZa84-ZzL.riCiatdO5JatLD3uHbcbUj1BTFyeSr98AUDEL3nEZ44L4-auFM1zrYUO8UTCCnS8',NULL,59657780,0,1789645417905,1789733427286,0,0);
INSERT INTO "admins" ("id","email","name","role","password_hash","must_change","totp_secret","totp_pending","totp_last","disabled","created_at","updated_at","failed_logins","locked") VALUES(3,'xaif@fiaxe.com','Xaif','owner','pbkdf2$100000$UX5KxSXpplywTyihy_KR5A$f7zQyJGEIuXfVnqxnyktjvpy_PmxFnv-qK1oLVhhtmg',0,'v1.sjvSYGE4kV6Wg1gs.gxpD3lXPdha1ba6GC0OTFHNBEQ_FwzZGjLrPV0QCR4MEG_1fCOUWU6ieuv8ySNz9',NULL,59657699,0,1789645489708,1789730945519,0,0);
INSERT INTO "admins" ("id","email","name","role","password_hash","must_change","totp_secret","totp_pending","totp_last","disabled","created_at","updated_at","failed_logins","locked") VALUES(4,'astha.bhatt@socheers.net','Astha','editor','pbkdf2$100000$luEsvnK5WHxshh1FsQWdFQ$WOMq9etOT1V6hF-sVOET5gMuAbD3crlAHxeFDC3wOZk',0,NULL,NULL,0,0,1789729348414,1789729348414,0,0);
CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  last_seen  INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  ip         TEXT,
  user_agent TEXT
);
INSERT INTO "sessions" ("token_hash","admin_id","created_at","last_seen","expires_at","ip","user_agent") VALUES('UF0sWe5j9VBSy9o4-GRNSy7IHjzgNuqnRpa_rtaf1UM',4,1789730710355,1789730710355,1789773910355,'103.76.77.156','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36');
INSERT INTO "sessions" ("token_hash","admin_id","created_at","last_seen","expires_at","ip","user_agent") VALUES('eXU2035XiTXOJlAehv61naySz5uNrEkTxA4T_4U-ZOM',2,1789730760824,1789733573380,1789773960824,'103.19.197.26','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36');
INSERT INTO "sessions" ("token_hash","admin_id","created_at","last_seen","expires_at","ip","user_agent") VALUES('gHFsAIZi5Mq6lHKHsBWpr0jRATVW5xagVBr_Mz7yuiw',3,1789730977521,1789731123230,1789774177521,'103.19.197.26','Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36');
CREATE TABLE login_attempts (
  key          TEXT PRIMARY KEY,   
  failures     INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
INSERT INTO "login_attempts" ("key","failures","window_start") VALUES('ip:2402:3a80:1983:bbf0:c825:e113:425c:8037',1,1789659630417);
INSERT INTO "login_attempts" ("key","failures","window_start") VALUES('ip:103.76.77.156',1,1789730694374);
INSERT INTO "login_attempts" ("key","failures","window_start") VALUES('reset-ip:103.19.197.26',1,1789730725746);
INSERT INTO "login_attempts" ("key","failures","window_start") VALUES('reset:veeransh@fiaxe.com',1,1789730725821);
INSERT INTO "login_attempts" ("key","failures","window_start") VALUES('ip:103.19.197.26',1,1789730971747);
CREATE TABLE audit_log (
  id       INTEGER PRIMARY KEY AUTOINCREMENT,
  at       INTEGER NOT NULL,
  admin_id INTEGER,
  action   TEXT NOT NULL,
  detail   TEXT,
  ip       TEXT
);
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(1,1789646690181,2,'login.ok',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(2,1789646690782,2,'insights.seed',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(3,1789646713058,2,'upload','image SoCheers Colors.jpg /media/u/luqglff1wmxbcif5petd.jpg','103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(4,1789646790039,2,'blog.create','test','103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(5,1789646791997,2,'blog.update','test published->published','103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(6,1789646805942,2,'blog.update','test published->published','103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(7,1789647095852,2,'settings.insights',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(8,1789659630609,2,'login.fail','veeransh@fiaxe.com','2402:3a80:1983:bbf0:c825:e113:425c:8037');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(9,1789659640881,2,'login.ok',NULL,'2402:3a80:1983:bbf0:c825:e113:425c:8037');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(10,1789659685140,2,'blog.update','test published->draft','2402:3a80:1983:bbf0:c825:e113:425c:8037');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(11,1789659691953,2,'insights.reorder',NULL,'2402:3a80:1983:bbf0:c825:e113:425c:8037');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(12,1789659692488,2,'blog.update','test draft->draft','2402:3a80:1983:bbf0:c825:e113:425c:8037');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(13,1789711880643,3,'login.ok',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(14,1789711898344,3,'blog.delete','test','103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(15,1789711952517,3,'settings.logoWall',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(16,1789712005280,3,'settings.logoWall',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(17,1789730694527,4,'login.fail','astha.bhatt@socheers.net','103.76.77.156');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(18,1789730710421,4,'login.ok',NULL,'103.76.77.156');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(19,1789730726518,2,'password.resetAsked',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(20,1789730753867,2,'password.reset',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(21,1789730760901,2,'login.ok',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(22,1789730774536,1,'login.ok',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(23,1789730819555,1,'admin.update','xaif@fiaxe.com {"role":"owner"}','103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(24,1789730835314,1,'admin.update','veeransh@fiaxe.com {"role":"owner"}','103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(25,1789730879548,1,'logout',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(26,1789730892555,3,'login.ok',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(27,1789730945588,3,'2fa.on',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(28,1789730952545,3,'logout',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(29,1789730971907,3,'login.fail.2fa','xaif@fiaxe.com','103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(30,1789730977613,3,'login.ok',NULL,'103.19.197.26');
INSERT INTO "audit_log" ("id","at","admin_id","action","detail","ip") VALUES(31,1789733427363,2,'2fa.on',NULL,'103.19.197.26');
CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  updated_by INTEGER
);
INSERT INTO "settings" ("key","value","updated_at","updated_by") VALUES('insights','{"hero":{"eyebrow":"Insights & resources","line1":"Things worth ","line2":"reading.","lede":"White papers, reports, and the occasional rant from people who actually do this for a living."},"tabs":[{"id":"blogs","label":"Blogs","live":true},{"id":"whitepapers","label":"White Papers","live":true},{"id":"reports","label":"Reports","live":true}],"defaultTab":"whitepapers","soonLabel":"Coming soon","topicsTag":"What we write about","topics":[{"name":"Content & Social Marketing","copy":"What keeps a feed worth following once the algorithm stops doing the work for you."},{"name":"Social Listening & Analysis","copy":"Turning real-time conversation into something a brand can actually act on."},{"name":"Influencer Marketing","copy":"Matching brands with creators whose audience already trusts them - and knowing when not to."},{"name":"SoCheers Films","copy":"Production notes from the sets, edits and pitches behind the work."},{"name":"Digital Campaign & Strategy","copy":"The thinking that has to hold before a single asset gets made."},{"name":"Digital Media Planning & Buying","copy":"Where the budget actually goes, and why the obvious channel isn''t always the right one."}]}',1789647095778,2);
INSERT INTO "settings" ("key","value","updated_at","updated_by") VALUES('insightsSeeded','true',1789646690708,2);
INSERT INTO "settings" ("key","value","updated_at","updated_by") VALUES('logoWall','{"rows":[{"dir":"left","speed":34,"items":[{"id":"r0-0","name":"Netflix","kind":"mark","src":"/assets/clients/netflix.webp","ar":3.64,"k":1.01,"display":"mask"},{"id":"r0-1","name":"JioHotstar","kind":"mark","src":"/assets/clients/jiohotstar.webp","ar":5.78,"k":0.72,"display":"mask"},{"id":"r0-2","name":"TCS","kind":"mark","src":"/assets/clients/tcs.webp","ar":1.56,"k":1.47,"display":"mask"},{"id":"r0-3","name":"Pantaloons","kind":"mark","src":"/assets/clients/pantaloons.webp","ar":8.1,"k":0.64,"display":"mask"},{"id":"r0-4","name":"Raymond","kind":"mark","src":"/assets/clients/raymond.webp","ar":3,"k":1.39,"display":"mask"},{"id":"r0-5","name":"Superdry","kind":"mark","src":"/assets/clients/superdry.webp","ar":4.32,"k":0.88,"display":"mask"},{"id":"r0-6","name":"ITC","kind":"text","k":1,"font":"","weight":700,"italic":false,"upper":false},{"id":"r0-7","name":"Sunfeast Yippee!","kind":"mark","src":"/assets/clients/yippee.webp","ar":1.84,"k":2.12,"display":"mask"},{"id":"r0-8","name":"Nykaa Pro","kind":"mark","src":"/assets/clients/nykaapro.webp","ar":3.87,"k":1.14,"display":"mask"},{"id":"r0-9","name":"Schweppes","kind":"mark","src":"/assets/clients/schweppes.webp","ar":2.19,"k":1.68,"display":"mask"},{"id":"r0-10","name":"Universal Pictures","kind":"text","k":1,"font":"","weight":700,"italic":false,"upper":false},{"id":"r0-11","name":"Sony LIV","kind":"mark","src":"/assets/clients/sonyliv.webp","ar":5.39,"k":0.67,"display":"mask"}]},{"dir":"right","speed":34,"items":[{"id":"r1-0","name":"Audi","kind":"text","k":1,"font":"","weight":700,"italic":false,"upper":false},{"id":"r1-1","name":"YES Bank","kind":"mark","src":"/assets/clients/yesbank.webp","ar":6.47,"k":0.7,"display":"mask"},{"id":"r1-2","name":"Bingo!","kind":"mark","src":"/assets/clients/bingo.webp","ar":1.71,"k":1.97,"display":"mask"},{"id":"r1-3","name":"Carlton","kind":"mark","src":"/assets/clients/carlton.webp","ar":8.07,"k":0.63,"display":"mask"},{"id":"r1-4","name":"Broadway","kind":"mark","src":"/assets/clients/broadway.webp","ar":3.85,"k":1.09,"display":"mask"},{"id":"r1-5","name":"Dabur","kind":"mark","src":"/assets/clients/dabur.webp","ar":3.1,"k":1.08,"display":"mask"},{"id":"r1-6","name":"Haldiram''s","kind":"mark","src":"/assets/clients/haldirams.webp","ar":3.65,"k":1.12,"display":"mask"},{"id":"r1-7","name":"Chandon","kind":"mark","src":"/assets/clients/chandon.webp","ar":7.82,"k":0.51,"display":"mask"},{"id":"r1-8","name":"Glenmorangie","kind":"mark","src":"/assets/clients/glenmorangie.webp","ar":7.79,"k":0.7,"display":"mask"},{"id":"r1-9","name":"ASUS","kind":"mark","src":"/assets/clients/asus.webp","ar":4.82,"k":0.81,"display":"mask"},{"id":"r1-10","name":"IndusInd","kind":"text","k":1,"font":"","weight":700,"italic":false,"upper":false},{"id":"r1-11","name":"boAt","kind":"mark","src":"/assets/clients/boat.webp","ar":2.4,"k":1.37,"display":"mask"}]},{"dir":"left","speed":34,"items":[{"id":"r2-0","name":"Havmor","kind":"mark","src":"/assets/clients/havmor.webp","ar":3.83,"k":1.07,"display":"mask"},{"id":"r2-1","name":"Belgian Waffle","kind":"text","k":1,"font":"","weight":700,"italic":false,"upper":false},{"id":"r2-2","name":"Zurich Kotak","kind":"text","k":1,"font":"","weight":700,"italic":false,"upper":false},{"id":"r2-3","name":"BHIM","kind":"mark","src":"/assets/clients/bhim.webp","ar":4.8,"k":0.81,"display":"mask"},{"id":"r2-4","name":"Lupin","kind":"mark","src":"/assets/clients/lupin.webp","ar":4.1,"k":0.72,"display":"mask"},{"id":"r2-5","name":"Reliance General","kind":"mark","src":"/assets/clients/reliance.webp","ar":3.44,"k":1.11,"display":"mask"},{"id":"r2-6","name":"Croma","kind":"mark","src":"/assets/clients/croma.webp","ar":4.21,"k":1.03,"display":"mask"},{"id":"r2-7","name":"Nykaa","kind":"mark","src":"/assets/clients/nykaa.webp","ar":3.05,"k":1.47,"display":"mask"},{"id":"r2-8","name":"Schweppes","kind":"mark","src":"/assets/clients/schweppes.webp","ar":2.19,"k":1.68,"display":"mask"},{"id":"r2-9","name":"ITC","kind":"text","k":1,"font":"","weight":700,"italic":false,"upper":false}]}]}',1789712005208,3);
CREATE TABLE uploads (
  id           TEXT PRIMARY KEY,
  kind         TEXT NOT NULL CHECK (kind IN ('image', 'font', 'pdf')),
  r2_key       TEXT NOT NULL,
  url          TEXT NOT NULL,
  name         TEXT NOT NULL,   
  content_type TEXT NOT NULL,
  size         INTEGER NOT NULL,
  width        INTEGER,
  height       INTEGER,
  created_at   INTEGER NOT NULL,
  created_by   INTEGER
);
INSERT INTO "uploads" ("id","kind","r2_key","url","name","content_type","size","width","height","created_at","created_by") VALUES('luqglff1wmxbcif5petd','image','media/u/luqglff1wmxbcif5petd.jpg','/media/u/luqglff1wmxbcif5petd.jpg','SoCheers Colors.jpg','image/jpeg',300060,1600,900,1789646712986,2);
CREATE TABLE posts (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  type         TEXT NOT NULL CHECK (type IN ('blog', 'whitepaper', 'report')),
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  excerpt      TEXT NOT NULL DEFAULT '',
  cover        TEXT NOT NULL DEFAULT '',
  cover_alt    TEXT NOT NULL DEFAULT '',
  author       TEXT NOT NULL DEFAULT '',
  tags         TEXT NOT NULL DEFAULT '[]',
  data         TEXT NOT NULL DEFAULT '{}',
  position     INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL CHECK (status IN ('draft', 'published')),
  published_at INTEGER,
  created_at   INTEGER NOT NULL,
  updated_at   INTEGER NOT NULL,
  updated_by   INTEGER
);
INSERT INTO "posts" ("id","type","slug","title","excerpt","cover","cover_alt","author","tags","data","position","status","published_at","created_at","updated_at","updated_by") VALUES(1,'whitepaper','parasocial-marketing','The Parasocial Marketing Whitepaper','A close look at the one-sided relationships audiences build with the creators they follow - and what it actually takes for a brand to earn a place inside that bond instead of interrupting it.','','','','[]','{"tag":"Featured whitepaper","points":["Why parasocial trust converts differently than reach or impressions","Reading the signals that separate a genuine creator fit from a rented audience","Building influencer partnerships that outlast a single campaign"],"pdf":"/assets/whitepapers/parasocial-marketing.pdf","file":"The-Friendship-Illusion-Whitepaper.pdf","cta":"Open the paper","pages":["/assets/whitepapers/parasocial-marketing/p01.jpg","/assets/whitepapers/parasocial-marketing/p02.jpg","/assets/whitepapers/parasocial-marketing/p03.jpg","/assets/whitepapers/parasocial-marketing/p04.jpg","/assets/whitepapers/parasocial-marketing/p05.jpg","/assets/whitepapers/parasocial-marketing/p06.jpg","/assets/whitepapers/parasocial-marketing/p07.jpg","/assets/whitepapers/parasocial-marketing/p08.jpg","/assets/whitepapers/parasocial-marketing/p09.jpg","/assets/whitepapers/parasocial-marketing/p10.jpg","/assets/whitepapers/parasocial-marketing/p11.jpg","/assets/whitepapers/parasocial-marketing/p12.jpg","/assets/whitepapers/parasocial-marketing/p13.jpg","/assets/whitepapers/parasocial-marketing/p14.jpg","/assets/whitepapers/parasocial-marketing/p15.jpg","/assets/whitepapers/parasocial-marketing/p16.jpg","/assets/whitepapers/parasocial-marketing/p17.jpg","/assets/whitepapers/parasocial-marketing/p18.jpg","/assets/whitepapers/parasocial-marketing/p19.jpg","/assets/whitepapers/parasocial-marketing/p20.jpg","/assets/whitepapers/parasocial-marketing/p21.jpg","/assets/whitepapers/parasocial-marketing/p22.jpg","/assets/whitepapers/parasocial-marketing/p23.jpg","/assets/whitepapers/parasocial-marketing/p24.jpg","/assets/whitepapers/parasocial-marketing/p25.jpg","/assets/whitepapers/parasocial-marketing/p26.jpg","/assets/whitepapers/parasocial-marketing/p27.jpg","/assets/whitepapers/parasocial-marketing/p28.jpg","/assets/whitepapers/parasocial-marketing/p29.jpg","/assets/whitepapers/parasocial-marketing/p30.jpg","/assets/whitepapers/parasocial-marketing/p31.jpg","/assets/whitepapers/parasocial-marketing/p32.jpg","/assets/whitepapers/parasocial-marketing/p33.jpg","/assets/whitepapers/parasocial-marketing/p34.jpg","/assets/whitepapers/parasocial-marketing/p35.jpg"]}',0,'published',1789646690708,1789646690708,1789646690708,2);
INSERT INTO "posts" ("id","type","slug","title","excerpt","cover","cover_alt","author","tags","data","position","status","published_at","created_at","updated_at","updated_by") VALUES(2,'report','metro-myopia','Breaking The Metro Myopia','A strategic report and playbook unlocking the new demand drivers of the hinterland.','','','','[]','{"tag":"Featured report","points":["How Aadhaar, UPI and Jio built Digital Bharat - and the numbers behind it","Who India''s Next Billion Users are, from Gen Z to Digital Naris","The Bharat Playbook: what ShareChat, Meesho, HUL, ITC and Coca-Cola got right"],"pdf":"/assets/whitepapers/SoCheers_Reports-Metro_Myopia_2025-26.pdf","file":"SoCheers_Reports-Metro_Myopia_2025-26.pdf","cta":"Open the report","pages":["/assets/whitepapers/metro-myopia/p01.jpg","/assets/whitepapers/metro-myopia/p02.jpg","/assets/whitepapers/metro-myopia/p03.jpg","/assets/whitepapers/metro-myopia/p04.jpg","/assets/whitepapers/metro-myopia/p05.jpg","/assets/whitepapers/metro-myopia/p06.jpg","/assets/whitepapers/metro-myopia/p07.jpg","/assets/whitepapers/metro-myopia/p08.jpg","/assets/whitepapers/metro-myopia/p09.jpg","/assets/whitepapers/metro-myopia/p10.jpg","/assets/whitepapers/metro-myopia/p11.jpg","/assets/whitepapers/metro-myopia/p12.jpg","/assets/whitepapers/metro-myopia/p13.jpg","/assets/whitepapers/metro-myopia/p14.jpg","/assets/whitepapers/metro-myopia/p15.jpg","/assets/whitepapers/metro-myopia/p16.jpg","/assets/whitepapers/metro-myopia/p17.jpg","/assets/whitepapers/metro-myopia/p18.jpg","/assets/whitepapers/metro-myopia/p19.jpg","/assets/whitepapers/metro-myopia/p20.jpg","/assets/whitepapers/metro-myopia/p21.jpg","/assets/whitepapers/metro-myopia/p22.jpg","/assets/whitepapers/metro-myopia/p23.jpg","/assets/whitepapers/metro-myopia/p24.jpg","/assets/whitepapers/metro-myopia/p25.jpg","/assets/whitepapers/metro-myopia/p26.jpg","/assets/whitepapers/metro-myopia/p27.jpg","/assets/whitepapers/metro-myopia/p28.jpg","/assets/whitepapers/metro-myopia/p29.jpg","/assets/whitepapers/metro-myopia/p30.jpg","/assets/whitepapers/metro-myopia/p31.jpg","/assets/whitepapers/metro-myopia/p32.jpg","/assets/whitepapers/metro-myopia/p33.jpg","/assets/whitepapers/metro-myopia/p34.jpg","/assets/whitepapers/metro-myopia/p35.jpg","/assets/whitepapers/metro-myopia/p36.jpg","/assets/whitepapers/metro-myopia/p37.jpg","/assets/whitepapers/metro-myopia/p38.jpg","/assets/whitepapers/metro-myopia/p39.jpg","/assets/whitepapers/metro-myopia/p40.jpg","/assets/whitepapers/metro-myopia/p41.jpg","/assets/whitepapers/metro-myopia/p42.jpg","/assets/whitepapers/metro-myopia/p43.jpg","/assets/whitepapers/metro-myopia/p44.jpg","/assets/whitepapers/metro-myopia/p45.jpg","/assets/whitepapers/metro-myopia/p46.jpg","/assets/whitepapers/metro-myopia/p47.jpg","/assets/whitepapers/metro-myopia/p48.jpg","/assets/whitepapers/metro-myopia/p49.jpg","/assets/whitepapers/metro-myopia/p50.jpg","/assets/whitepapers/metro-myopia/p51.jpg","/assets/whitepapers/metro-myopia/p52.jpg","/assets/whitepapers/metro-myopia/p53.jpg","/assets/whitepapers/metro-myopia/p54.jpg","/assets/whitepapers/metro-myopia/p55.jpg","/assets/whitepapers/metro-myopia/p56.jpg","/assets/whitepapers/metro-myopia/p57.jpg","/assets/whitepapers/metro-myopia/p58.jpg","/assets/whitepapers/metro-myopia/p59.jpg","/assets/whitepapers/metro-myopia/p60.jpg","/assets/whitepapers/metro-myopia/p61.jpg","/assets/whitepapers/metro-myopia/p62.jpg","/assets/whitepapers/metro-myopia/p63.jpg","/assets/whitepapers/metro-myopia/p64.jpg","/assets/whitepapers/metro-myopia/p65.jpg","/assets/whitepapers/metro-myopia/p66.jpg","/assets/whitepapers/metro-myopia/p67.jpg","/assets/whitepapers/metro-myopia/p68.jpg","/assets/whitepapers/metro-myopia/p69.jpg","/assets/whitepapers/metro-myopia/p70.jpg","/assets/whitepapers/metro-myopia/p71.jpg","/assets/whitepapers/metro-myopia/p72.jpg","/assets/whitepapers/metro-myopia/p73.jpg"]}',1,'published',1789646690708,1789646690708,1789646690708,2);
CREATE TABLE templates (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  blocks     TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  created_by INTEGER
);
CREATE TABLE password_links (
  token_hash TEXT PRIMARY KEY,
  admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  kind       TEXT NOT NULL CHECK (kind IN ('reset', 'welcome')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',3);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('admins',4);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('audit_log',31);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('posts',3);
CREATE INDEX sessions_admin ON sessions(admin_id);
CREATE INDEX audit_at ON audit_log(at);
CREATE INDEX uploads_kind ON uploads(kind, created_at);
CREATE INDEX posts_live ON posts(type, status, position, published_at);
CREATE INDEX password_links_admin ON password_links(admin_id);
