const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Task = require('../models/Task');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { sendSuccess, asyncHandler, normalizeWard } = require('../utils/helpers');

// GET /api/analytics/dashboard - Overall stats
router.get('/dashboard', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  let reportFilter = {};
  let userFilter = { isActive: true };
  let taskFilter = {};

  if (req.user.role === 'admin') {
    const ward = req.user.ward ? normalizeWard(req.user.ward) : 'unassigned';
    reportFilter.ward = { $in: [ward, 'unassigned'] };
    userFilter.ward = ward;
    
    const reportsInWard = await Report.find({ ward: { $in: [ward, 'unassigned'] } }).select('_id');
    taskFilter.reportId = { $in: reportsInWard.map(r => r._id) };
  }

  const [totalReports, pendingReports, completedReports, totalUsers, totalTasks, recentReports] = await Promise.all([
    Report.countDocuments(reportFilter),
    Report.countDocuments({ ...reportFilter, status: 'pending' }),
    Report.countDocuments({ ...reportFilter, status: 'completed' }),
    User.countDocuments(userFilter),
    Task.countDocuments(taskFilter),
    Report.find(reportFilter).sort({ createdAt: -1 }).limit(5).populate('reporter', 'name'),
  ]);

  const assignedReports = await Report.countDocuments({ ...reportFilter, status: { $in: ['assigned', 'in-progress'] } });
  const rejectedReports = await Report.countDocuments({ ...reportFilter, status: 'rejected' });

  sendSuccess(res, 200, {
    totalReports,
    pendingReports,
    completedReports,
    assignedReports,
    rejectedReports,
    totalUsers,
    totalTasks,
    recentReports,
    resolutionRate: totalReports > 0
      ? Math.round((completedReports / totalReports) * 100) : 0,
  }, 'Dashboard data fetched');
}));

// GET /api/analytics/hotspots - GeoJSON hotspot cluster data
router.get('/hotspots', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  let matchFilter = {};
  if (req.user.role === 'admin') {
    const ward = req.user.ward ? normalizeWard(req.user.ward) : 'unassigned';
    matchFilter.ward = { $in: [ward, 'unassigned'] };
  }

  const hotspots = await Report.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: {
          lng: { $round: [{ $arrayElemAt: ['$location.coordinates', 0] }, 3] },
          lat: { $round: [{ $arrayElemAt: ['$location.coordinates', 1] }, 3] },
        },
        count: { $sum: 1 },
        ward: { $first: '$ward' },
        avgConfidence: { $avg: '$detectionConfidence' },
        latestReport: { $max: '$createdAt' },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 200 },
    {
      $project: {
        lat: '$_id.lat',
        lng: '$_id.lng',
        count: 1,
        ward: 1,
        avgConfidence: 1,
        latestReport: 1,
        _id: 0,
      },
    },
  ]);

  // Convert to GeoJSON FeatureCollection
  const geojson = {
    type: 'FeatureCollection',
    features: hotspots.map((h) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [h.lng, h.lat] },
      properties: { count: h.count, ward: h.ward, avgConfidence: h.avgConfidence, latestReport: h.latestReport },
    })),
  };

  sendSuccess(res, 200, { hotspots, geojson }, 'Hotspots fetched');
}));

// GET /api/analytics/trends - Time-series reports over time
router.get('/trends', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days));

  let matchFilter = { createdAt: { $gte: startDate } };
  if (req.user.role === 'admin') {
    const ward = req.user.ward ? normalizeWard(req.user.ward) : 'unassigned';
    matchFilter.ward = { $in: [ward, 'unassigned'] };
  }

  const trends = await Report.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const sourceBreakdown = await Report.aggregate([
    { $match: matchFilter },
    { $group: { _id: '$source', count: { $sum: 1 } } },
  ]);

  sendSuccess(res, 200, { trends, sourceBreakdown, days: parseInt(days) }, 'Trends fetched');
}));

// GET /api/analytics/workers - Worker performance
router.get('/workers', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  let matchFilter = {};
  if (req.user.role === 'admin') {
    const ward = req.user.ward ? normalizeWard(req.user.ward) : 'unassigned';
    const reportsInWard = await Report.find({ ward: { $in: [ward, 'unassigned'] } }).select('_id');
    matchFilter.reportId = { $in: reportsInWard.map(r => r._id) };
  }

  const performance = await Task.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: '$assignedWorker',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
        avgCompletionTime: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ['$completedAt', null] }, { $ne: ['$createdAt', null] }] },
              { $subtract: ['$completedAt', '$createdAt'] },
              null,
            ],
          },
        },
      },
    },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'worker' } },
    { $unwind: '$worker' },
    {
      $project: {
        'worker.name': 1, 'worker.email': 1, 'worker.ward': 1,
        total: 1, completed: 1, pending: 1, inProgress: 1,
        avgCompletionTimeMs: '$avgCompletionTime',
        completionRate: { $cond: [{ $gt: ['$total', 0] }, { $divide: ['$completed', '$total'] }, 0] },
      },
    },
    { $sort: { completionRate: -1 } },
  ]);

  sendSuccess(res, 200, performance, 'Worker performance fetched');
}));

// GET /api/analytics/wards - Ward breakdown
router.get('/wards', authenticate, authorize('admin', 'superadmin'), asyncHandler(async (req, res) => {
  const wardStats = await Report.aggregate([
    {
      $group: {
        _id: '$ward',
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
        high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } },
        avgConfidence: { $avg: '$detectionConfidence' },
      },
    },
    { $sort: { total: -1 } },
  ]);

  sendSuccess(res, 200, wardStats, 'Ward analytics fetched');
}));

module.exports = router;
