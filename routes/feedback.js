// routes/feedback.js
import express from "express";
import Feedback from "../models/feedback.js";
import Form from "../models/form.js";
import axios from "axios";

const router = express.Router();

/* =========================
   IP -> Location helper
   ========================= */
const ipCache = new Map();
const IP_CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

function normalizeIp(ip) {
  if (!ip) return ip;
  const s = String(ip).trim();
  return s.startsWith("::ffff:") ? s.replace(/^::ffff:/i, "") : s;
}

async function resolveIpToLabel(ip) {
  if (!ip) return null;
  const key = normalizeIp(ip);
  const cached = ipCache.get(key);
  if (cached && Date.now() - cached.ts < IP_CACHE_TTL) return cached.val;

  // Localhost shortcut
  if (["::1", "127.0.0.1"].includes(key)) {
    const v = { city: null, region: null, country: null, label: "Localhost" };
    ipCache.set(key, { val: v, ts: Date.now() });
    return v;
  }

  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(
      key
    )}?fields=status,query,city,regionName,country`;
    const r = await axios.get(url, { timeout: 4000 });
    const d = r.data;
    if (d?.status === "success") {
      const parts = [d.city, d.regionName, d.country].filter(Boolean);
      const val = {
        city: d.city || null,
        region: d.regionName || null,
        country: d.country || null,
        label: parts.length ? parts.join(", ") : "Unknown",
      };
      ipCache.set(key, { val, ts: Date.now() });
      return val;
    }
  } catch (err) {
    console.warn("resolveIpToLabel failed", err?.message || err);
  }

  const fallback = { city: null, region: null, country: null, label: "Unknown" };
  ipCache.set(key, { val: fallback, ts: Date.now() });
  return fallback;
}

/* =========================================
   Reverse-geocode client coords -> label
   (tiny Nominatim helper + cache)
   ========================================= */
const locCache = new Map();
const LOC_CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

function locCacheGet(key) {
  const v = locCache.get(key);
  if (!v) return null;
  if (Date.now() - v.ts > LOC_CACHE_TTL) {
    locCache.delete(key);
    return null;
  }
  return v.val;
}
function locCacheSet(key, val) {
  locCache.set(key, { val, ts: Date.now() });
}

async function reverseGeocodeLatLng(lat, lng) {
  if (typeof lat !== "number" || typeof lng !== "number") return null;
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const cached = locCacheGet(key);
  if (cached) return cached;

  try {
    const resp = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        format: "jsonv2",
        lat,
        lon: lng,
        zoom: 10, // city/region level
        addressdetails: 1,
        "accept-language": "en",
      },
      headers: {
        "User-Agent": process.env.NOMINATIM_UA || "my-app/1.0 (you@domain.com)",
      },
      timeout: 7000,
    });

    const data = resp.data;
    if (data) {
      const addr = data.address || {};
      const parts = [];
      if (addr.city) parts.push(addr.city);
      else if (addr.town) parts.push(addr.town);
      else if (addr.village) parts.push(addr.village);
      else if (addr.hamlet) parts.push(addr.hamlet);

      if (addr.state && !parts.includes(addr.state)) parts.push(addr.state);
      if (addr.country && !parts.includes(addr.country)) parts.push(addr.country);

      const label =
        parts.length ? parts.join(", ") : data.display_name || `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;

      const out = {
        label,
        city: parts[0] || null,
        region: addr.state || null,
        country: addr.country || null,
      };
      locCacheSet(key, out);
      return out;
    }
  } catch (err) {
    console.warn("reverseGeocodeLatLng failed", err?.message || err);
  }
  return null;
}

/* =========================
   Save feedback (POST)
   ========================= */
router.post("/", async (req, res) => {
  try {
    const { formId, formName, responses, metadata } = req.body;

    if (!formId || !formName || !responses) {
      return res
        .status(400)
        .json({ success: false, error: "formId, formName and responses are required" });
    }

    // capture client IP properly (works with proxies if trust proxy is set)
    const ip =
      (req.headers["x-forwarded-for"] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)[0] ||
      req.socket?.remoteAddress ||
      req.ip ||
      "";

    // minimal safe metadata extraction
    const safeMeta = {
      utm: metadata?.utm || {},
      referrer: metadata?.referrer || "",
      pageUrl: metadata?.pageUrl || "",
      userAgent: metadata?.userAgent || "",
      location: metadata?.location || null, // expected { lat, lng, accuracy? }
      clientTs: metadata?.clientTs ? new Date(metadata.clientTs) : undefined,
    };

    // --- ENRICH: ipGeo (server IP lookup) ---
    if (ip) {
      try {
        const geo = await resolveIpToLabel(ip);
        if (geo) {
          safeMeta.ipGeo = {
            city: geo.city,
            region: geo.region,
            country: geo.country,
            label: geo.label,
          };
        }
      } catch (err) {
        console.warn("ip geo enrichment failed", err?.message || err);
      }
    }

    // --- ENRICH: if client provided coords, reverse-geocode to a label and store as locationLabel / locationGeo ---
  // inside router.post("/", ...)

// --- ENRICH: if client provided coords, reverse-geocode to a label and store as locationLabel / locationGeo ---
if (
  safeMeta.location &&
  typeof safeMeta.location.lat === "number" &&
  typeof safeMeta.location.lng === "number"
) {
  try {
    const lat = Number(safeMeta.location.lat);
    const lng = Number(safeMeta.location.lng);

    const locGeo = await reverseGeocodeLatLng(lat, lng);
    if (locGeo) {
      safeMeta.locationLabel = locGeo.label;
      safeMeta.locationGeo = {
        city: locGeo.city || null,
        region: locGeo.region || null,
        country: locGeo.country || null,
        label: locGeo.label,
        lat,    // <<--- include original coords
        lon: lng // <<--- include original coords
      };
    } else {
      // fallback: keep coords as a readable label
      const label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      safeMeta.locationLabel = label;
      safeMeta.locationGeo = {
        city: null,
        region: null,
        country: null,
        label,
        lat,
        lon: lng
      };
    }
  } catch (err) {
    console.warn("reverse geocode enrichment failed", err?.message || err);
  }
}


    const newFeedback = await Feedback.create({
      formId,
      formName,
      responses,
      metadata: safeMeta,
      clientIp: ip,
    });

    return res.status(201).json({ success: true, data: newFeedback });
  } catch (err) {
    console.error("Feedback save error:", err);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/* =========================
   Get feedbacks (unchanged)
   ========================= */
router.get("/", async (req, res) => {
  const { uid, query } = req.query;

  let feedbacks = [];

  if (uid) {
    const userForms = await Form.find({ userId: uid }).lean();
    const formIds = userForms.map((f) => f.customId);
    feedbacks = await Feedback.find({ formId: { $in: formIds } }).lean();
  } else if (query) {
    feedbacks = await Feedback.find({
      $or: [
        { "responses.name": { $regex: new RegExp(query, "i") } },
        { "responses.email": { $regex: new RegExp(query, "i") } },
      ],
    }).lean();
  } else {
    return res.json({ feedbacksByForm: {} });
  }

  const feedbacksByForm = {};
  feedbacks.forEach((fb) => {
    const id = fb.formId.toString();
    if (!feedbacksByForm[id]) feedbacksByForm[id] = [];
    feedbacksByForm[id].push(fb);
  });

  return res.json({ success: true, feedbacksByForm });
});

export default router;
