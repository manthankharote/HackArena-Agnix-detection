const express = require('express');
const router = express.Router();
const axios = require('axios');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * @route   GET /api/cctv/stream
 * @desc    Proxies the live YOLO-processed MJPEG stream from local Python engine
 * @access  Private (Admins & Superadmins only)
 */
router.get('/stream', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const pythonEngineUrl = process.env.PYTHON_ENGINE_URL || 'http://127.0.0.1:7861';
  const pythonStreamUrl = `${pythonEngineUrl}/stream`;

  try {
    const response = await axios({
      method: 'get',
      url: pythonStreamUrl,
      responseType: 'stream',
      timeout: 15000 // 15 seconds connection timeout
    });

    // Forward the content type header (multipart/x-mixed-replace; boundary=frame)
    const contentType = response.headers['content-type'] || 'multipart/x-mixed-replace; boundary=frame';
    res.setHeader('Content-Type', contentType);

    // Pipe the python MJPEG stream directly to the response client
    response.data.pipe(res);

    // If client closes connection (e.g. leaves page), terminate the upstream stream request
    req.on('close', () => {
      if (response.data && typeof response.data.destroy === 'function') {
        response.data.destroy();
      }
    });

  } catch (error) {
    console.error('❌ CCTV Stream proxy error:', error.message);
    res.status(502).json({ 
      success: false, 
      message: 'Failed to connect to internal CCTV streaming engine. Make sure the YOLO script is running.' 
    });
  }
});

/**
 * @route   POST /api/cctv/config
 * @desc    Updates the video source on the local Python stream server
 * @access  Private (Admins & Superadmins only)
 */
router.post('/config', authenticate, authorize('admin', 'superadmin'), async (req, res) => {
  const { source, url } = req.body;
  const pythonEngineUrl = process.env.PYTHON_ENGINE_URL || 'http://127.0.0.1:7861';
  const pythonConfigUrl = `${pythonEngineUrl}/switch-source`;

  try {
    const response = await axios.post(pythonConfigUrl, { source, url });
    if (response.data.success) {
      res.json({ success: true, message: response.data.message });
    } else {
      res.status(400).json({ success: false, message: response.data.message });
    }
  } catch (error) {
    console.error('❌ Failed to update stream configuration:', error.message);
    res.status(502).json({ 
      success: false, 
      message: 'Failed to communicate with internal CCTV streaming engine.' 
    });
  }
});

module.exports = router;
