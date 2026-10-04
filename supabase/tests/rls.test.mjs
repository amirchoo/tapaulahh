// Security checks for RLS, triggers, RPCs and storage.
//
//   npm run test:db
//
// Runs against the project in .env (needs SUPABASE_SECRET_KEY). It creates
// temporary rows and users prefixed "zz-test" and deletes them at the end.
// Don't point it at production once real users exist; use a local or staging DB.
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUB = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE = process.env.SUPABASE_SECRET_KEY;
if (!URL || !PUB || !SERVICE) {
  console.error(
    "Needs NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY in .env",
  );
  process.exit(1);
}
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(URL, SERVICE, opts); // bypasses RLS
const anon = createClient(URL, PUB, opts);

let pass = 0,
  fail = 0;
const ok = (cond, label, extra = "") => {
  if (cond) pass++;
  else fail++;
  console.log(
    `${cond ? "PASS" : "FAIL"}  ${label}${extra ? "  — " + extra : ""}`,
  );
};
const must = ({ data, error }, what) => {
  if (error) throw new Error(`${what}: ${error.message}`);
  return data;
};

const created = { users: [], pasars: [] };
const pw = "Zz-test-" + Math.random().toString(36).slice(2) + "!9";

async function signedIn(email) {
  const c = createClient(URL, PUB, opts);
  must(
    await c.auth.signInWithPassword({ email, password: pw }),
    "sign in " + email,
  );
  return c;
}

try {
  // ---------- fixtures (as service role) ----------
  const mkUser = async (email) => {
    const u = must(
      await admin.auth.admin.createUser({
        email,
        password: pw,
        email_confirm: true,
        user_metadata: { full_name: "ZZ Test" },
      }),
      "create user",
    );
    created.users.push(u.user.id);
    return u.user.id;
  };
  const userA = await mkUser(`zz-test-a-${Date.now()}@example.com`);
  const userB = await mkUser(`zz-test-b-${Date.now()}@example.com`);
  const emailA = (await admin.auth.admin.getUserById(userA)).data.user.email;
  const emailB = (await admin.auth.admin.getUserById(userB)).data.user.email;

  const prof = must(
    await admin
      .from("profiles")
      .select("id, display_name, role")
      .eq("id", userA)
      .single(),
    "profile",
  );
  ok(
    prof.display_name === "ZZ Test" && prof.role === "user",
    "signup trigger creates profile (role user)",
  );

  const point = (lng, lat) => `SRID=4326;POINT(${lng} ${lat})`;
  const [active, inactive] = must(
    await admin
      .from("pasars")
      .insert(
        [
          {
            slug: "zz-test-aktif",
            name: "ZZ Test Pasar Aktif",
            location: point(101.4905, 3.0727),
            district: "Shah Alam",
            address: "Jalan Ujian",
          },
          {
            slug: "zz-test-tutup",
            name: "ZZ Test Pasar Tutup",
            location: point(101.5, 3.08),
            district: "Shah Alam",
            status: "inactive",
          },
        ],
        { defaultToNull: false },
      )
      .select("id, lat, lng"),
    "insert pasars",
  );
  created.pasars.push(active.id, inactive.id);
  ok(
    Math.abs(active.lat - 3.0727) < 1e-6 &&
      Math.abs(active.lng - 101.4905) < 1e-6,
    "generated lat/lng columns",
    `${active.lat}, ${active.lng}`,
  );

  must(
    await admin.from("pasar_schedules").insert(
      [
        {
          pasar_id: active.id,
          day_of_week: 3,
          start_time: "17:00",
          end_time: "23:00",
        },
        {
          pasar_id: inactive.id,
          day_of_week: 3,
          start_time: "17:00",
          end_time: "23:00",
        },
      ],
      { defaultToNull: false },
    ),
    "schedules",
  );

  const cat = must(
    await admin
      .from("vendor_categories")
      .select("id")
      .eq("slug", "bakar-panggang")
      .single(),
    "category",
  );
  const [vActive, vPending] = must(
    await admin
      .from("vendors")
      .insert(
        [
          {
            pasar_id: active.id,
            slug: "zz-burger",
            name: "ZZ Burger Bakar",
            category_id: cat.id,
            status: "active",
          },
          {
            pasar_id: active.id,
            slug: "zz-pending",
            name: "ZZ Pending Stall",
            status: "pending",
          },
        ],
        { defaultToNull: false },
      )
      .select("id"),
    "vendors",
  );

  must(
    await admin.from("vendor_items").insert(
      [
        { vendor_id: vActive.id, name: "Burger daging special", price_rm: 8.5 },
        { vendor_id: vPending.id, name: "Hidden item", price_rm: 1 },
      ],
      { defaultToNull: false },
    ),
    "vendor items",
  );

  const [bApproved, bPending] = must(
    await admin
      .from("home_businesses")
      .insert(
        [
          {
            slug: "zz-kek",
            name: "ZZ Kek Mak Ton",
            owner_id: userB,
            district: "Shah Alam",
            status: "approved",
          },
          {
            slug: "zz-pending-shop",
            name: "ZZ Pending Shop",
            owner_id: userB,
            district: "Shah Alam",
            status: "pending",
          },
        ],
        { defaultToNull: false },
      )
      .select("id"),
    "businesses",
  );
  must(
    await admin.from("catalog_items").insert(
      [
        { business_id: bApproved.id, name: "Kek batik", price_rm: 35 },
        { business_id: bPending.id, name: "Secret item", price_rm: 1 },
      ],
      { defaultToNull: false },
    ),
    "catalog",
  );

  // ---------- privacy: fuzzed location ----------
  const home = { lng: 101.5122, lat: 3.0508 };
  must(
    await admin.from("home_business_locations").insert({
      business_id: bApproved.id,
      address: "No 1 Jalan Rahsia",
      location: point(home.lng, home.lat),
    }),
    "private location",
  );
  const pub1 = must(
    await admin
      .from("home_businesses")
      .select("public_lat, public_lng")
      .eq("id", bApproved.id)
      .single(),
    "public loc",
  );
  const dist = (a, b) => {
    const R = 6371000,
      r = (d) => (d * Math.PI) / 180;
    const h =
      Math.sin(r(b.lat - a.lat) / 2) ** 2 +
      Math.cos(r(a.lat)) *
        Math.cos(r(b.lat)) *
        Math.sin(r(b.lng - a.lng) / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  };
  const d1 = dist(home, { lat: pub1.public_lat, lng: pub1.public_lng });
  ok(
    d1 >= 290 && d1 <= 610,
    "public location fuzzed 300–600 m from real spot",
    `${d1.toFixed(0)} m`,
  );
  must(
    await admin
      .from("home_business_locations")
      .update({
        address: "No 1 Jalan Rahsia (edited)",
        location: point(home.lng, home.lat),
      })
      .eq("business_id", bApproved.id),
    "re-save",
  );
  const pub2 = must(
    await admin
      .from("home_businesses")
      .select("public_lat, public_lng")
      .eq("id", bApproved.id)
      .single(),
    "public loc 2",
  );
  ok(
    pub1.public_lat === pub2.public_lat && pub1.public_lng === pub2.public_lng,
    "re-saving same spot gives same fuzzed point (no averaging)",
  );

  // ---------- anonymous visitor: reads ----------
  const aPasars = must(
    await anon.from("pasars").select("slug").like("slug", "zz-test-%"),
    "anon pasars",
  );
  ok(
    aPasars.length === 1 && aPasars[0].slug === "zz-test-aktif",
    "anon sees active pasar only",
    JSON.stringify(aPasars.map((p) => p.slug)),
  );
  const aSched = must(
    await anon
      .from("pasar_schedules")
      .select("pasar_id")
      .in("pasar_id", [active.id, inactive.id]),
    "anon sched",
  );
  ok(
    aSched.length === 1 && aSched[0].pasar_id === active.id,
    "anon sees schedules of active pasar only",
  );
  const aVendors = must(
    await anon.from("vendors").select("slug").eq("pasar_id", active.id),
    "anon vendors",
  );
  ok(
    aVendors.length === 1 && aVendors[0].slug === "zz-burger",
    "anon sees active stalls only",
  );
  const aVItems = must(
    await anon
      .from("vendor_items")
      .select("name, price_rm")
      .in("vendor_id", [vActive.id, vPending.id]),
    "anon vendor items",
  );
  ok(
    aVItems.length === 1 &&
      aVItems[0].name === "Burger daging special" &&
      Number(aVItems[0].price_rm) === 8.5,
    "anon sees menu of active stalls only",
  );
  const aVItemWrite = await anon
    .from("vendor_items")
    .insert({ vendor_id: vActive.id, name: "Anon item" })
    .select();
  ok(aVItemWrite.error !== null, "anon cannot add menu items");
  const menuHit = must(
    await anon.rpc("search_all", { query: "burger daging" }),
    "search menu",
  );
  ok(
    menuHit.some((r) => r.kind === "vendor" && r.slug === "zz-burger"),
    "search_all finds stall by menu item",
  );

  const aBiz = must(
    await anon
      .from("home_businesses")
      .select("slug, public_lat")
      .like("slug", "zz-%"),
    "anon biz",
  );
  ok(
    aBiz.length === 1 && aBiz[0].slug === "zz-kek",
    "anon sees approved shops only",
  );
  const aItems = must(
    await anon
      .from("catalog_items")
      .select("name")
      .in("business_id", [bApproved.id, bPending.id]),
    "anon items",
  );
  ok(
    aItems.length === 1 && aItems[0].name === "Kek batik",
    "anon sees catalog of approved shops only",
  );
  const aLoc = await anon.from("home_business_locations").select("address");
  ok(
    aLoc.error !== null || aLoc.data.length === 0,
    "anon cannot read exact shop locations",
    aLoc.error?.message ?? `${aLoc.data.length} rows`,
  );
  const aProf = await anon.from("profiles").select("id");
  ok(
    aProf.error !== null || aProf.data.length === 0,
    "anon cannot read profiles",
  );
  const aCats = must(
    await anon.from("vendor_categories").select("slug"),
    "anon cats",
  );
  ok(aCats.length === 12, "anon reads vendor categories", `${aCats.length}`);

  // ---------- anonymous visitor: writes ----------
  const w1 = await anon.from("pasars").insert({
    slug: "zz-test-hack",
    name: "Hack",
    location: point(101, 3),
    district: "X",
  });
  ok(w1.error !== null, "anon cannot insert pasar", w1.error?.message);
  const w2 = await anon
    .from("pasars")
    .update({ name: "Hacked" })
    .eq("id", active.id)
    .select();
  ok(w2.error !== null || w2.data.length === 0, "anon cannot update pasar");
  const w3 = await anon.from("pasars").delete().eq("id", active.id).select();
  ok(w3.error !== null || w3.data.length === 0, "anon cannot delete pasar");
  const w4 = await anon
    .from("reports")
    .insert({ target_type: "pasar", target_id: active.id, reason: "x" });
  ok(
    w4.error !== null,
    "anon cannot report (login required)",
    w4.error?.message,
  );
  const w5 = await anon
    .from("vendors")
    .insert({ pasar_id: active.id, slug: "zz-anon", name: "Anon stall" });
  ok(w5.error !== null, "anon cannot register a stall", w5.error?.message);
  const w6 = await anon.storage
    .from("business-photos")
    .upload(
      `zz-test/${Date.now()}.png`,
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
    );
  ok(w6.error !== null, "anon cannot upload photos", w6.error?.message);
  const stillThere = must(
    await admin.from("pasars").select("name").eq("id", active.id).single(),
    "check",
  );
  ok(
    stillThere.name === "ZZ Test Pasar Aktif",
    "active pasar unchanged after anon attempts",
  );

  // ---------- RPCs ----------
  const near = must(
    await anon.rpc("pasars_near", { lat: 3.07, lng: 101.49, radius_m: 5000 }),
    "pasars_near",
  );
  const nearZz = near.filter((p) => p.slug.startsWith("zz-test"));
  ok(
    nearZz.length === 1 &&
      nearZz[0].slug === "zz-test-aktif" &&
      nearZz[0].schedules.length === 1 &&
      nearZz[0].schedules[0].start_time === "17:00",
    "pasars_near: active only, with schedules",
    nearZz.map((p) => `${p.slug} ${p.distance_m.toFixed(0)}m`).join(", "),
  );
  const nearTue = must(
    await anon.rpc("pasars_near", {
      lat: 3.07,
      lng: 101.49,
      radius_m: 5000,
      day_of_week: 2,
    }),
    "near tue",
  );
  ok(
    !nearTue.some((p) => p.slug === "zz-test-aktif"),
    "pasars_near: day filter excludes other days",
  );
  const s1 = must(
    await anon.rpc("search_all", { query: "zz test pasar" }),
    "search",
  );
  ok(
    s1.some((r) => r.slug === "zz-test-aktif") &&
      !s1.some((r) => r.slug === "zz-test-tutup"),
    "search_all finds active pasar, not inactive",
  );
  const s2 = must(
    await anon.rpc("search_all", { query: "burger bakar" }),
    "search 2",
  );
  const hit = s2.find((r) => r.slug === "zz-burger");
  ok(
    hit?.kind === "vendor" && hit?.parent_slug === "zz-test-aktif",
    "search_all finds stall with its pasar slug",
  );
  const s3 = must(
    await anon.rpc("search_all", { query: "kek batik" }),
    "search 3",
  );
  ok(
    s3.some((r) => r.slug === "zz-kek") &&
      !s3.some((r) => r.slug === "zz-pending-shop"),
    "search_all finds shop by catalog item; hides pending",
  );
  const s4 = must(
    await anon.rpc("search_all", { query: "burgr bakr" }),
    "search typo",
  );
  ok(
    s4.some((r) => r.slug === "zz-burger"),
    "search_all tolerates typos (burgr bakr)",
  );

  // ---------- signed-in user A ----------
  const a = await signedIn(emailA);
  const esc = await a
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", userA)
    .select();
  ok(
    esc.error !== null,
    "user cannot make themselves admin",
    esc.error?.message,
  );
  const nm = await a
    .from("profiles")
    .update({ display_name: "ZZ Renamed" })
    .eq("id", userA)
    .select();
  ok(
    !nm.error && nm.data[0]?.display_name === "ZZ Renamed",
    "user can edit own display name",
  );

  const reg = await a
    .from("vendors")
    .insert({
      pasar_id: active.id,
      slug: "zz-mine",
      name: "ZZ My Stall",
      status: "active",
      owner_id: userB,
    })
    .select("status, owner_id")
    .single();
  ok(
    !reg.error && reg.data.status === "pending" && reg.data.owner_id === userA,
    "registered stall forced to pending + owned by registrant",
    reg.error?.message ?? JSON.stringify(reg.data),
  );
  const promote = await a
    .from("vendors")
    .update({ status: "active" })
    .eq("slug", "zz-mine")
    .select();
  ok(
    promote.error !== null,
    "owner cannot approve own stall",
    promote.error?.message,
  );
  const edit = await a
    .from("vendors")
    .update({ description: "Sedap" })
    .eq("slug", "zz-mine")
    .select("description");
  ok(
    !edit.error && edit.data[0]?.description === "Sedap",
    "owner can edit own stall info",
  );
  const other = await a
    .from("vendors")
    .update({ name: "Hijacked" })
    .eq("id", vActive.id)
    .select();
  ok(
    other.error !== null || other.data.length === 0,
    "user cannot edit someone else's stall",
  );
  const otherItem = await a
    .from("vendor_items")
    .insert({ vendor_id: vActive.id, name: "Sneaky item" })
    .select();
  ok(
    otherItem.error !== null,
    "user cannot add menu items to someone else's stall",
  );
  const mine = must(
    await a.from("vendors").select("id").eq("slug", "zz-mine").single(),
    "my stall",
  );
  const myItem = await a
    .from("vendor_items")
    .insert({ vendor_id: mine.id, name: "Air tebu", price_rm: 3 })
    .select("name");
  ok(
    !myItem.error && myItem.data[0]?.name === "Air tebu",
    "stall owner can add menu items to own stall",
    myItem.error?.message,
  );
  const seePending = must(
    await a.from("vendors").select("slug").eq("id", vPending.id),
    "A pending",
  );
  ok(seePending.length === 0, "user cannot see other pending stalls");

  const shop = await a
    .from("home_businesses")
    .insert({
      slug: "zz-a-shop",
      name: "ZZ A Shop",
      district: "Klang",
      status: "approved",
      public_location: point(0, 0),
    })
    .select("id, status, public_lat")
    .single();
  ok(
    !shop.error &&
      shop.data.status === "pending" &&
      shop.data.public_lat === null,
    "new shop forced to pending; can't set public location",
    shop.error?.message,
  );
  const locA = await a
    .from("home_business_locations")
    .insert({ business_id: shop.data.id, location: point(101.45, 3.04) });
  ok(!locA.error, "owner saves exact location", locA.error?.message);
  const afterLoc = must(
    await a
      .from("home_businesses")
      .select("public_lat")
      .eq("id", shop.data.id)
      .single(),
    "after loc",
  );
  ok(
    afterLoc.public_lat !== null,
    "public location computed after owner saves exact spot",
  );
  const peek = must(
    await a
      .from("home_business_locations")
      .select("business_id")
      .eq("business_id", bApproved.id),
    "peek",
  );
  ok(peek.length === 0, "user cannot read another shop's exact location");
  const bPend = must(
    await a.from("home_businesses").select("slug").eq("id", bPending.id),
    "b pending",
  );
  ok(bPend.length === 0, "user cannot see another user's pending shop");
  const itemOther = await a
    .from("catalog_items")
    .insert({ business_id: bApproved.id, name: "Spam", price_rm: 0 });
  ok(
    itemOther.error !== null,
    "user cannot add items to someone else's shop",
    itemOther.error?.message,
  );

  const rep = await a
    .from("reports")
    .insert({
      target_type: "pasar",
      target_id: active.id,
      reason: "wrong day",
      status: "resolved",
    })
    .select("status, reporter_id")
    .single();
  ok(
    !rep.error && rep.data.status === "open" && rep.data.reporter_id === userA,
    "report forced open, from the reporter",
    rep.error?.message,
  );
  const fav = await a
    .from("favourites")
    .insert({ target_type: "pasar", target_id: active.id });
  ok(!fav.error, "user saves a favourite", fav.error?.message);

  const claim = await a
    .from("vendor_claims")
    .insert({ vendor_id: vActive.id, message: "This is my stall" })
    .select("id, status")
    .single();
  ok(
    !claim.error && claim.data.status === "pending",
    "user claims a stall (pending)",
    claim.error?.message,
  );
  const selfApprove = await a
    .from("vendor_claims")
    .update({ status: "approved" })
    .eq("id", claim.data.id)
    .select();
  ok(
    selfApprove.error !== null || selfApprove.data.length === 0,
    "user cannot approve own claim",
  );

  const up = await a.storage
    .from("business-photos")
    .upload(
      `${userA}/zz-test.png`,
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
    );
  ok(!up.error, "user uploads to own photo folder", up.error?.message);
  const upOther = await a.storage
    .from("business-photos")
    .upload(
      `${userB}/zz-test.png`,
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
    );
  ok(
    upOther.error !== null,
    "user cannot upload into someone else's folder",
    upOther.error?.message,
  );
  const upPasar = await a.storage
    .from("pasar-photos")
    .upload(
      `zz-test.png`,
      new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
    );
  ok(
    upPasar.error !== null,
    "user cannot upload pasar photos (admin only)",
    upPasar.error?.message,
  );

  // ---------- user B as admin ----------
  must(
    await admin.from("profiles").update({ role: "admin" }).eq("id", userB),
    "promote B",
  );
  const b = await signedIn(emailB);
  const bReports = must(
    await b.from("reports").select("id").eq("target_id", active.id),
    "admin reports",
  );
  ok(bReports.length === 1, "admin sees all reports");
  const approve = await b
    .from("vendor_claims")
    .update({ status: "approved" })
    .eq("id", claim.data.id)
    .select();
  ok(
    !approve.error && approve.data.length === 1,
    "admin approves claim",
    approve.error?.message,
  );
  const owner = must(
    await admin
      .from("vendors")
      .select("owner_id")
      .eq("id", vActive.id)
      .single(),
    "owner",
  );
  ok(owner.owner_id === userA, "approved claim hands stall to claimant");
  const bSeesInactive = must(
    await b.from("pasars").select("slug").eq("id", inactive.id),
    "admin inactive",
  );
  ok(bSeesInactive.length === 1, "admin sees inactive pasars");
  const bApprove = await b
    .from("home_businesses")
    .update({ status: "approved" })
    .eq("id", shop.data.id)
    .select("status");
  ok(
    !bApprove.error && bApprove.data[0]?.status === "approved",
    "admin approves a shop",
  );
  const bPasar = await b
    .from("pasars")
    .update({ parking_notes: "Parking tepi jalan" })
    .eq("id", active.id)
    .select("parking_notes");
  ok(
    !bPasar.error && bPasar.data[0]?.parking_notes === "Parking tepi jalan",
    "admin edits pasar",
  );

  await admin.storage.from("business-photos").remove([`${userA}/zz-test.png`]);
} catch (e) {
  fail++;
  console.log("ERROR ", e.message);
} finally {
  // ---------- cleanup ----------
  if (created.pasars.length)
    await admin.from("pasars").delete().in("id", created.pasars);
  for (const id of created.users) await admin.auth.admin.deleteUser(id);
  const leftP = (await admin.from("pasars").select("id").like("slug", "zz-%"))
    .data?.length;
  const leftB = (
    await admin.from("home_businesses").select("id").like("slug", "zz-%")
  ).data?.length;
  const leftU = (
    await admin.from("profiles").select("id").in("id", created.users)
  ).data?.length;
  console.log(
    `\ncleanup: pasars left ${leftP}, shops left ${leftB}, profiles left ${leftU}`,
  );
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exitCode = fail ? 1 : 0;
}
