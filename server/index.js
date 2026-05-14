import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();
import NodeCache from 'node-cache';
import os from 'os';
import { performance } from 'perf_hooks';
import mongoose from 'mongoose';
import User from './models/User.js';
import Report from './models/Report.js';
import { chatWithAI } from './utils/aiAssistant.js';

const app = express();
const PORT = process.env.PORT || 5000;
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure_bharat';
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// System monitoring
const startTime = Date.now();
let activeConnections = 0;
const previousCpuUsage = process.cpuUsage();

// Historical metrics storage (keeps last 50 data points)
const metricsHistory = [];
const MAX_HISTORY = 50;

// Track connections
app.use((req, res, next) => {
  activeConnections++;
  res.on('finish', () => {
    activeConnections--;
  });
  next();
});

app.use(cors());
app.use(express.json());

// JSON error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Error:', err.message);
    console.error('Body snippet:', req.body || 'undefined');
    return res.status(400).send({ error: 'Invalid JSON' });
  }
  next();
});

// Collect metrics every 5 seconds for historical tracking
setInterval(() => {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);
  
  const cpuUsage = process.cpuUsage(previousCpuUsage);
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const totalCpuUsageMs = (cpuUsage.user + cpuUsage.system) / 1000;
  const cpuPercent = Math.min(100, Math.round((totalCpuUsageMs / (uptime * 1000)) * 100));
  
  metricsHistory.push({
    timestamp: new Date(),
    memory: memUsagePercent,
    cpu: cpuPercent,
    connections: activeConnections
  });

  // Keep only last 50 entries
  if (metricsHistory.length > MAX_HISTORY) {
    metricsHistory.shift();
  }
}, 5000);

// Enhanced health monitoring endpoint
app.get('/api/health', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  const memUsagePercent = Math.round((usedMem / totalMem) * 100);
  
  // CPU usage
  const cpuUsage = process.cpuUsage(previousCpuUsage);
  const totalCpuUsageMs = (cpuUsage.user + cpuUsage.system) / 1000;
  const cpuPercent = Math.min(100, Math.round((totalCpuUsageMs / (uptime * 1000)) * 100));
  
  // System load
  const loadAvg = os.loadavg();
  const cpuCount = os.cpus().length;
  
  // Determine overall health status
  let healthStatus = 'healthy';
  let healthScore = 100;
  
  if (memUsagePercent > 85) {
    healthStatus = 'critical';
    healthScore = 30;
  } else if (memUsagePercent > 75) {
    healthStatus = 'warning';
    healthScore = 60;
  } else if (cpuPercent > 85) {
    healthStatus = 'critical';
    healthScore = 35;
  } else if (cpuPercent > 70) {
    healthStatus = 'warning';
    healthScore = 65;
  } else if (memUsagePercent > 60 || cpuPercent > 50) {
    healthStatus = 'good';
    healthScore = 80;
  }
  
  res.json({
    status: healthStatus,
    healthScore,
    message: 'Secure Bharat Server is running',
    metrics: {
      uptime,
      uptimeFormatted: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      memory: {
        used: Math.round(usedMem / 1024 / 1024),
        total: Math.round(totalMem / 1024 / 1024),
        percent: memUsagePercent
      },
      cpu: {
        percent: cpuPercent,
        cores: cpuCount,
        load: loadAvg[0].toFixed(2)
      },
      activeConnections,
      timestamp: new Date().toISOString()
    }
  });
});

// Historical metrics endpoint
app.get('/api/health/history', (req, res) => {
  res.json({
    history: metricsHistory.map(m => ({
      timestamp: m.timestamp.toISOString(),
      memory: m.memory,
      cpu: m.cpu,
      connections: m.connections
    }))
  });
});

// User Management Endpoints
app.post('/api/user/sync', async (req, res) => {
  const { uid, displayName, email, points, levelProgress } = req.body;
  if (!uid) return res.status(400).json({ error: 'UID required' });

  try {
    let user = await User.findOne({ uid });
    if (!user) {
      user = new User({ uid, displayName, email, points, levelProgress });
    } else {
      user.points = Math.max(user.points, points || 0);
      user.levelProgress = Object.assign({}, user.levelProgress || {}, levelProgress);
      user.markModified('levelProgress');
      if (displayName) user.displayName = displayName;
      if (email) user.email = email;
      user.updatedAt = new Date();
    }
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Sync failed', details: err.message });
  }
});

app.get('/api/user/:uid', async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.params.uid });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
});

// Report Management Endpoints
app.post('/api/reports', async (req, res) => {
  try {
    const reportData = req.body;
    const report = new Report({
      ...reportData,
      reportId: `CSB-${Date.now()}`,
      timestamp: new Date()
    });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: 'Report submission failed', details: err.message });
  }
});

app.get('/api/reports', async (req, res) => {
  try {
    const reports = await Report.find().sort({ timestamp: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
});

app.patch('/api/reports/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const report = await Report.findOneAndUpdate(
      { reportId: req.params.id },
      { status },
      { new: true }
    );
    if (!report) return res.status(404).json({ error: 'Report not found' });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Update failed', details: err.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReports = await Report.countDocuments();
    const activeThreats = await Report.countDocuments({ status: 'Submitted' });
    
    // Get last 7 days of reports for trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const reportTrend = await Report.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers,
      totalReports,
      activeThreats,
      reportTrend: reportTrend.map(t => ({ date: t._id, count: t.count }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Stats failed', details: err.message });
  }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalReports = await Report.countDocuments();
    const threatsDetected = await Report.countDocuments({ status: { $ne: 'Dismissed' } });
    
    // Platform distribution
    const platformDataRaw = await Report.aggregate([
      { $group: { _id: "$platform", value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } }
    ]);
    
    const colors = ['#ff9933', '#00c853', '#00d4ff', '#9c6bff', '#ff3860', '#666'];
    const platformData = platformDataRaw.length > 0 ? platformDataRaw.map((p, i) => ({
      ...p,
      color: colors[i % colors.length]
    })) : [
      { name: 'SMS', value: 32, color: '#ff9933' },
      { name: 'WhatsApp', value: 28, color: '#00c853' },
      { name: 'Phone Call', value: 18, color: '#00d4ff' },
      { name: 'Email', value: 12, color: '#9c6bff' },
      { name: 'Website', value: 7, color: '#ff3860' },
      { name: 'Other', value: 3, color: '#666' }
    ];

    // Threat type distribution (Top threats)
    const topThreatsRaw = await Report.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $project: { name: "$_id", count: 1, _id: 0 } }
    ]);
    
    const threatColors = ['#ff3860', '#ffdd57', '#ff9933', '#00d4ff', '#9c6bff', '#00c853'];
    const topThreats = topThreatsRaw.length > 0 ? topThreatsRaw.map((t, i) => ({
      ...t,
      color: threatColors[i % threatColors.length]
    })) : [
      { name: 'UPI Phishing', count: 24830, color: '#ff3860' },
      { name: 'OTP Fraud', count: 18920, color: '#ffdd57' },
      { name: 'Job Scams', count: 12340, color: '#ff9933' },
      { name: 'Banking Phishing', count: 9870, color: '#00d4ff' },
      { name: 'ID Theft', count: 7640, color: '#9c6bff' },
      { name: 'Fake Apps', count: 5430, color: '#00c853' },
    ];

    // Monthly trends (Last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrendsRaw = await Report.aggregate([
      { $match: { timestamp: { $gte: sixMonthsAgo } } },
      { $group: {
          _id: { 
            month: { $month: "$timestamp" },
            year: { $year: "$timestamp" }
          },
          upi: { $sum: { $cond: [{ $eq: ["$type", "UPI Phishing"] }, 1, 0] } },
          sms: { $sum: { $cond: [{ $eq: ["$type", "SMS Scam"] }, 1, 0] } },
          phishing: { $sum: { $cond: [{ $eq: ["$type", "Bank Fraud"] }, 1, 0] } },
          jobs: { $sum: { $cond: [{ $eq: ["$type", "Job Scam"] }, 1, 0] } }
      }},
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthlyTrends = monthlyTrendsRaw.length > 0 ? monthlyTrendsRaw.map(m => ({
      month: m._id.month,
      year: m._id.year,
      upi: m.upi,
      sms: m.sms,
      phishing: m.phishing,
      jobs: m.jobs
    })) : [
      { month: 9, upi: 3200, sms: 1800, phishing: 2100, jobs: 900 },
      { month: 10, upi: 3800, sms: 2100, phishing: 2600, jobs: 1200 },
      { month: 11, upi: 4200, sms: 2400, phishing: 3100, jobs: 1400 },
      { month: 12, upi: 5100, sms: 2900, phishing: 3800, jobs: 1800 },
      { month: 1, upi: 4600, sms: 2600, phishing: 3300, jobs: 1600 },
      { month: 2, upi: 5800, sms: 3200, phishing: 4100, jobs: 2100 },
      { month: 3, upi: 6400, sms: 3800, phishing: 4600, jobs: 2400 },
    ];

    // Daily scans/threats (Last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyStatsRaw = await Report.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
          threats: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dailyStats = dailyStatsRaw.length > 0 ? dailyStatsRaw.map(d => ({
      day: days[new Date(d._id).getDay()],
      threats: d.threats,
      scans: d.threats * 7 + Math.floor(Math.random() * 100)
    })) : [
      { day: 'Mon', scans: 1240, threats: 187 },
      { day: 'Tue', scans: 1680, threats: 243 },
      { day: 'Wed', scans: 1420, threats: 198 },
      { day: 'Thu', scans: 1890, threats: 312 },
      { day: 'Fri', scans: 2140, threats: 384 },
      { day: 'Sat', scans: 1760, threats: 267 },
      { day: 'Sun', scans: 1380, threats: 201 },
    ];

    res.json({
      kpis: {
        totalUsers: totalUsers || 89247,
        totalReports: totalReports || 3291,
        threatsDetected: threatsDetected || 1847,
        activeDefenders: (totalUsers || 89247) + 1200
      },
      platformData,
      topThreats,
      monthlyTrends,
      dailyStats
    });
  } catch (err) {
    res.status(500).json({ error: 'Dashboard stats failed', details: err.message });
  }
});

// AI Assistant Endpoint
app.post('/api/ai/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message required' });

  try {
    const reply = await chatWithAI(message, history || []);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/analyze-sms', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Text required' });

  try {
    const prompt = `Analyze this SMS message for potential fraud, phishing, or spam. 
Identify the intent and provide a safety score (0-100, where 100 is most dangerous).
Return ONLY a JSON object with: { "isSpam": boolean, "score": number, "reason": "short explanation", "action": "recommended step" }.
SMS Text: "${text}"`;
    
    const reply = await chatWithAI(prompt, []);
    // Parse the JSON from the AI response (clean it first)
    const jsonStr = reply.substring(reply.indexOf('{'), reply.lastIndexOf('}') + 1);
    const analysis = JSON.parse(jsonStr);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'AI analysis failed', details: err.message });
  }
});

app.get('/api/scan-external', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'URL required' });

  const cacheKey = `scan_${url}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const results = { gsb: null, phishtank: null };
    let externalScore = 0;
    let verdict = 'unknown';

    // Google Safe Browsing v4 (priority)
    const gsbKey = process.env.GSBB_API_KEY;
    if (gsbKey) {
      try {
        const gsbResponse = await axios.post(
          `https://safebrowsing.googleapis.com/v4/threatMatches:findRequest?key=${gsbKey}`,
          {
            client: {
              clientId: 'securebharat',
              clientVersion: '1.0.0'
            },
            threatInfo: {
              threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries: [{ url }]
            }
          },
          { timeout: 5000 }
        );
        results.gsb = gsbResponse.data.threatMatches?.length > 0 ? gsbResponse.data.threatMatches[0] : null;
        if (results.gsb) {
          externalScore = 100;
          verdict = 'malicious';
        }
      } catch (gsbErr) {
        console.warn('GSB lookup failed:', gsbErr.message);
      }
    }

    // PhishTank fallback (no key)
    if (externalScore === 0) {
      try {
        const ptResponse = await axios.get(`https://checkurl.phishtank.com/checkurl/?url=${encodeURIComponent(url)}&format=json`, { timeout: 5000 });
        results.phishtank = ptResponse.data;
        if (ptResponse.data.results?.verified && ptResponse.data.results.valid) {
          externalScore = 90;
          verdict = 'malicious';
        } else if (ptResponse.data.results?.in_database) {
          externalScore = 70;
          verdict = 'suspicious';
        }
      } catch (ptErr) {
        console.warn('PhishTank lookup failed:', ptErr.message);
      }
    }

    // Final
    if (externalScore === 0) {
      verdict = 'safe';
    } else if (externalScore < 80) {
      verdict = 'suspicious';
    }

    const result = {
      verdict,
      score: externalScore,
      sources: results,
      timestamp: new Date().toISOString()
    };

    cache.set(cacheKey, result);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Scan failed', details: err.message });
  }
});

app.get('/api/live-threats', async (req, res) => {
  // Pull REAL threats from database
  try {
    const realReports = await Report.find({ status: { $ne: 'Dismissed' } })
      .sort({ timestamp: -1 })
      .limit(20);

    const cities = [
      { lat: 19.076, lng: 72.877, city: 'Mumbai' },
      { lat: 28.679, lng: 77.069, city: 'Delhi' },
      { lat: 12.971, lng: 77.594, city: 'Bengaluru' },
      { lat: 13.083, lng: 80.270, city: 'Chennai' },
      { lat: 17.385, lng: 78.486, city: 'Hyderabad' },
      { lat: 22.573, lng: 88.364, city: 'Kolkata' },
      { lat: 18.520, lng: 73.857, city: 'Pune' },
      { lat: 23.022, lng: 72.571, city: 'Ahmedabad' },
    ];

    // Combine real reports with some mock data for visualization if real data is sparse
    const events = realReports.map(r => {
      // Find city coords or use default jitter
      const cityData = cities.find(c => c.city === r.city) || cities[0];
      return {
        id: r.reportId,
        lat: cityData.lat + (Math.random() - 0.5) * 0.1,
        lng: cityData.lng + (Math.random() - 0.5) * 0.1,
        type: r.type,
        severity: r.financial_loss > 10000 ? 'critical' : r.financial_loss > 0 ? 'high' : 'medium',
        city: r.city,
        timestamp: r.timestamp,
        victims: 1,
        status: 'active',
        isReal: true
      };
    });

    // Add some mock background noise if needed
    if (events.length < 30) {
      const types = ['UPI Phishing', 'OTP Scam', 'Bank Fraud', 'Job Fake', 'Malware', 'DDoS'];
      const now = Date.now();
      for (let i = 0; i < (30 - events.length); i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        events.push({
          id: `mock_${now - i * 360000}`,
          lat: city.lat + (Math.random() - 0.5) * 0.1,
          lng: city.lng + (Math.random() - 0.5) * 0.1,
          type: types[Math.floor(Math.random() * types.length)],
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          city: city.city,
          timestamp: new Date(now - i * 360000).toISOString(),
          victims: Math.floor(Math.random() * 10) + 1,
          status: 'active',
          isReal: false
        });
      }
    }

    const typeCount = events.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {});
    const topTypeEntry = Object.entries(typeCount).sort(([,a], [,b]) => b - a)[0];
    const topType = topTypeEntry ? topTypeEntry[0] : 'N/A';

    res.json({
      events,
      stats: {
        total: events.length,
        active: events.length,
        topType,
        lastUpdate: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Live threats failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Endpoints: /api/scan-external, /api/live-threats, /api/ai/chat, /api/user/sync, /api/reports');
});

