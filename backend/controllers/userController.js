const User = require("../models/user");
const UserActivity = require("../models/userActivity");
const { uploadToCloudinary } = require("../configs/cloudinary");

// Save waste classification record
exports.saveRecord = async (req, res) => {
  try {
    if (!req.body) throw new Error("undefined body");
    if (!req.file) throw new Error("File is undefined");

    // Extract classification data from request body
    const { wasteType, category, confidence, recyclable, disposalMethod, description, detectedImageBase64 } = req.body;

    // Upload original image
    const originalImage = await uploadToCloudinary(req.file.buffer, "wasteVision/originals");
    if (!originalImage) throw new Error("Failed to upload original image");

    // Upload detected image with bounding boxes if provided
    let detectedImage = null;
    if (detectedImageBase64) {
      // Remove the data:image/png;base64, prefix if present
      const base64Data = detectedImageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      detectedImage = await uploadToCloudinary(buffer, "wasteVision/detected");
      if (!detectedImage) {
        console.warn("Failed to upload detected image, continuing without it");
      }
    }

    // Parse confidence - should be stored as decimal (0-1) not percentage
    const confidenceValue = parseFloat(confidence) || 0;
    const normalizedConfidence = confidenceValue > 1 ? confidenceValue / 100 : confidenceValue;

    // Parse recyclable - handle both string and boolean
    const isRecyclable = recyclable === true || recyclable === 'true';

    // Create the record
    const saveResult = await UserActivity.create({
      user: req.user.id,
      items: [{
        item: wasteType || 'Unknown',
        type: category || 'Unknown',
        confidence: normalizedConfidence, // Store as decimal (0-1)
        recyclable: isRecyclable,
        disposalMethod: disposalMethod || '',
        description: description || ''
      }],
      image: {
        public_id: originalImage.public_id,
        url: originalImage.secure_url,
      },
      detectedImage: detectedImage ? {
        public_id: detectedImage.public_id,
        url: detectedImage.secure_url,
      } : null,
      isSave: true,
    });

    if (!saveResult) throw new Error("Failed to save the result");

    return res.status(201).json({
      success: true,
      record: saveResult,
      category: category,
      confidence: normalizedConfidence,
      recyclable: isRecyclable,
      disposal_instructions: disposalMethod || '',
    });
  } catch (error) {
    console.log("Error in saveRecord:", error.message);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Fetch all user records
exports.fetchRecords = async (req, res) => {
  try {
    const records = await UserActivity.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      records: records,
    });
  } catch (error) {
    console.log("Error in fetchRecords:", error.message);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Fetch a single record by ID
exports.fetchRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await UserActivity.findOne({ 
      _id: id, 
      user: req.user.id 
    }).lean();

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    return res.status(200).json({
      success: true,
      record: record,
    });
  } catch (error) {
    console.log("Error in fetchRecordById:", error.message);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Delete a record by ID
exports.deleteRecord = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the record first to verify ownership
    const record = await UserActivity.findOne({ 
      _id: id, 
      user: req.user.id 
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found or you don't have permission to delete it"
      });
    }

    // Delete the record
    await UserActivity.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Record deleted successfully"
    });
  } catch (error) {
    console.log("Error in deleteRecord:", error.message);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};



exports.getUserStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Fetch all user records
    const records = await UserActivity.find({ user: userId });
    
    // Calculate statistics
    const stats = {
      totalClassifications: records.length,
      recyclableCount: 0,
      nonRecyclableCount: 0,
      categoryBreakdown: {},
      recentActivity: records.length > 0 ? records[0].createdAt : null,
      averageConfidence: 0
    };
    
    // Calculate category breakdown and average confidence
    let totalConfidence = 0;
    let totalItems = 0;
    
    records.forEach(record => {
      // Process each item in the items array
      if (record.items && record.items.length > 0) {
        record.items.forEach(item => {
          totalItems++;
          
          // Count recyclable vs non-recyclable
          if (item.recyclable) {
            stats.recyclableCount++;
          } else {
            stats.nonRecyclableCount++;
          }
          
          // Category breakdown - use the 'type' field which contains the category
          const category = item.type || 'Unknown';
          stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
          
          // Sum up confidence (stored as decimal 0-1, convert to percentage)
          const confidenceValue = parseFloat(item.confidence) || 0;
          // If value is less than or equal to 1, it's a decimal, multiply by 100
          // If value is greater than 1, it's already a percentage
          const confidencePercent = confidenceValue <= 1 ? confidenceValue * 100 : confidenceValue;
          totalConfidence += confidencePercent;
        });
      }
    });
    
    // Calculate average confidence as whole number (0-100)
    stats.averageConfidence = totalItems > 0 
      ? Math.round(totalConfidence / totalItems)
      : 0;
    
    // Get most common category
    const categories = Object.entries(stats.categoryBreakdown);
    stats.mostCommonCategory = categories.length > 0
      ? categories.sort((a, b) => b[1] - a[1])[0][0]
      : 'None';
    
    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.log("Error in getUserStatistics:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};