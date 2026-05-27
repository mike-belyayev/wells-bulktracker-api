// routes/wellRoutes.js
const express = require('express');
const router = express.Router();
const Well = require('../models/wellModel');
const dbConnect = require('../lib/mongodb');

// Helper function for error responses
const handleError = (res, error, customMessage = 'Server Error') => {
  console.error(`${customMessage}:`, error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({ 
      error: 'Duplicate key error',
      message: 'A well with this name already exists'
    });
  }
  
  if (error.name === 'MongoError' || error.name.includes('Mongo')) {
    return res.status(503).json({ 
      error: 'Database service unavailable',
      message: 'Please try again later'
    });
  }
  
  res.status(500).json({ error: customMessage });
};

// ==================== GET ROUTES ====================

// @route   GET /api/wells
// @desc    Get all wells
router.get('/', async (req, res) => {
  try {
    await dbConnect();
    const wells = await Well.find()
      .sort({ wellName: 1 })
      .maxTimeMS(10000);
    
    console.log(`Fetched ${wells.length} wells`);
    res.json(wells);
  } catch (err) {
    handleError(res, err, 'Failed to fetch wells');
  }
});

// @route   GET /api/wells/owner/:wellOwner
// @desc    Get all wells by well owner (rig)
router.get('/owner/:wellOwner', async (req, res) => {
  try {
    await dbConnect();
    const wellOwner = req.params.wellOwner;
    
    if (!wellOwner?.trim()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Well owner is required' 
      });
    }

    const wells = await Well.find({ wellOwner: wellOwner.trim() })
      .sort({ wellName: 1 })
      .maxTimeMS(10000);
    
    console.log(`Fetched ${wells.length} wells for owner: ${wellOwner}`);
    res.json(wells);
  } catch (err) {
    handleError(res, err, 'Failed to fetch wells by owner');
  }
});

// @route   GET /api/wells/name/:wellName
// @desc    Get specific well by name
router.get('/name/:wellName', async (req, res) => {
  try {
    await dbConnect();
    const wellName = req.params.wellName;
    
    if (!wellName?.trim()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'Well name is required' 
      });
    }

    const well = await Well.findOne({ wellName: wellName.trim() })
      .maxTimeMS(10000);
    
    if (!well) {
      return res.status(404).json({ 
        error: 'Not found',
        message: `Well '${wellName}' not found` 
      });
    }
    
    res.json(well);
  } catch (err) {
    handleError(res, err, 'Failed to fetch well');
  }
});

// @route   GET /api/wells/:id
// @desc    Get specific well by ID
router.get('/:id', async (req, res) => {
  try {
    await dbConnect();
    const well = await Well.findById(req.params.id)
      .maxTimeMS(10000);
    
    if (!well) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Well not found' 
      });
    }
    
    res.json(well);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid ID format',
        message: 'The provided well ID is invalid' 
      });
    }
    handleError(res, err, 'Failed to fetch well');
  }
});

// ==================== POST/CREATE ROUTES ====================

// @route   POST /api/wells
// @desc    Create a new well
router.post('/', async (req, res) => {
  try {
    await dbConnect();
    
    const { 
      wellName, wellOwner, waterDepth, airGap, HPWH,
      casingProfile, mudPits, bopSystems, mudPumpLiners, 
      cargoVessels, supplyVessels 
    } = req.body;

    if (!wellName?.trim()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'wellName is required' 
      });
    }

    if (!wellOwner?.trim()) {
      return res.status(400).json({ 
        error: 'Validation failed',
        message: 'wellOwner is required' 
      });
    }

    // Ensure casingProfile has indexes
    const processedCasingProfile = (casingProfile || []).map((profile, idx) => ({
      ...profile,
      index: profile.index !== undefined ? profile.index : idx
    }));

    const well = new Well({
      wellName: wellName.trim(),
      wellOwner: wellOwner.trim(),
      waterDepth: waterDepth || '',
      airGap: airGap || '',
      HPWH: HPWH || '',
      casingProfile: processedCasingProfile,
      mudPits: mudPits || [],
      bopSystems: bopSystems || [],
      mudPumpLiners: mudPumpLiners || [],
      cargoVessels: cargoVessels || [],
      supplyVessels: supplyVessels || []
    });

    const savedWell = await well.save();
    console.log(`Created new well: ${savedWell.wellName}`);
    
    res.status(201).json(savedWell);
  } catch (err) {
    handleError(res, err, 'Failed to create well');
  }
});

// routes/wellRoutes.js - Updated clone endpoint

// @route   POST /api/wells/:id/clone
// @desc    Clone a well with new name suffix
router.post('/:id/clone', async (req, res) => {
  try {
    await dbConnect();
    
    const originalWell = await Well.findById(req.params.id);
    if (!originalWell) {
      return res.status(404).json({ error: 'Well not found' });
    }

    // Create clone name
    const cloneName = `${originalWell.wellName} - Clone`;
    
    // Check if clone name already exists
    let finalCloneName = cloneName;
    let counter = 1;
    while (await Well.findOne({ wellName: finalCloneName })) {
      counter++;
      finalCloneName = `${originalWell.wellName} - Clone ${counter}`;
    }

    // Process casingProfile to ensure indexes exist
    let casingProfile = [];
    if (originalWell.casingProfile && originalWell.casingProfile.length > 0) {
      casingProfile = originalWell.casingProfile.map((profile, idx) => {
        const profileObj = profile.toObject ? profile.toObject() : profile;
        return {
          ...profileObj,
          index: profileObj.index !== undefined && profileObj.index !== null ? profileObj.index : idx
        };
      });
    }

    // Process supplyVessels - remove _id to let MongoDB create new ones
    let supplyVessels = [];
    if (originalWell.supplyVessels && originalWell.supplyVessels.length > 0) {
      supplyVessels = originalWell.supplyVessels.map(vessel => {
        const vesselObj = vessel.toObject ? vessel.toObject() : vessel;
        delete vesselObj._id;
        return vesselObj;
      });
    }

    // Process cargoVessels - remove _id to let MongoDB create new ones
    let cargoVessels = [];
    if (originalWell.cargoVessels && originalWell.cargoVessels.length > 0) {
      cargoVessels = originalWell.cargoVessels.map(vessel => {
        const vesselObj = vessel.toObject ? vessel.toObject() : vessel;
        delete vesselObj._id;
        return vesselObj;
      });
    }

    // Create new well object
    const clonedWellData = {
      wellName: finalCloneName,
      wellOwner: originalWell.wellOwner,
      waterDepth: originalWell.waterDepth,
      airGap: originalWell.airGap,
      HPWH: originalWell.HPWH,
      casingProfile: casingProfile,
      mudPits: originalWell.mudPits || [],
      bopSystems: originalWell.bopSystems || [],
      mudPumpLiners: originalWell.mudPumpLiners || [],
      cargoVessels: cargoVessels,  // Clone cargo vessels
      supplyVessels: supplyVessels  // Clone supply vessels
    };

    const clonedWell = new Well(clonedWellData);
    const savedClonedWell = await clonedWell.save();
    
    console.log(`Cloned well: ${originalWell.wellName} -> ${savedClonedWell.wellName}`);
    console.log(`  - Copied ${supplyVessels.length} supply vessels`);
    console.log(`  - Copied ${cargoVessels.length} cargo vessels`);
    
    res.status(201).json({
      message: 'Well cloned successfully',
      clonedWell: savedClonedWell
    });
  } catch (err) {
    console.error('Clone error:', err);
    handleError(res, err, 'Failed to clone well');
  }
});

// @route   POST /api/wells/fix-casing-indexes
// @desc    Add missing index fields to casingProfile arrays (one-time fix)
router.post('/fix-casing-indexes', async (req, res) => {
  try {
    await dbConnect();
    
    const wells = await Well.find({});
    let updatedCount = 0;
    let fixedWells = [];
    
    for (const well of wells) {
      let needsUpdate = false;
      
      if (well.casingProfile && well.casingProfile.length > 0) {
        const updatedCasingProfile = well.casingProfile.map((profile, idx) => {
          const profileObj = profile.toObject ? profile.toObject() : profile;
          if (profileObj.index === undefined || profileObj.index === null) {
            needsUpdate = true;
            return { ...profileObj, index: idx };
          }
          return profileObj;
        });
        
        if (needsUpdate) {
          well.casingProfile = updatedCasingProfile;
          await well.save();
          updatedCount++;
          fixedWells.push(well.wellName);
        }
      }
    }
    
    res.json({
      message: 'Casing profile indexes fixed',
      updatedCount,
      fixedWells
    });
  } catch (err) {
    console.error('Error fixing casing indexes:', err);
    handleError(res, err, 'Failed to fix casing indexes');
  }
});

// ==================== UPDATE ROUTES - Full Document ====================

// @route   PUT /api/wells/:id
// @desc    Update entire well (full replacement)
router.put('/:id', async (req, res) => {
  try {
    await dbConnect();
    
    const updatedWell = await Well.findByIdAndUpdate(
      req.params.id,
      req.body,
      { 
        new: true, 
        runValidators: true,
        maxTimeMS: 10000 
      }
    );

    if (!updatedWell) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Well not found' 
      });
    }

    console.log(`Updated well: ${updatedWell.wellName}`);
    res.json(updatedWell);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid ID format',
        message: 'The provided well ID is invalid' 
      });
    }
    handleError(res, err, 'Failed to update well');
  }
});

// ==================== PATCH ROUTES - Partial Updates ====================

// @route   PATCH /api/wells/:id
// @desc    Partially update well (efficient for single field updates)
router.patch('/:id', async (req, res) => {
  try {
    await dbConnect();
    
    const updateFields = req.body;
    
    // Remove any fields that shouldn't be updated directly
    delete updateFields._id;
    delete updateFields.__v;
    delete updateFields.createdAt;
    delete updateFields.updatedAt;
    
    const updatedWell = await Well.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { 
        new: true, 
        runValidators: true,
        maxTimeMS: 10000 
      }
    );

    if (!updatedWell) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Well not found' 
      });
    }

    console.log(`Patched well: ${updatedWell.wellName} - Updated fields: ${Object.keys(updateFields).join(', ')}`);
    res.json(updatedWell);
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid ID format',
        message: 'The provided well ID is invalid' 
      });
    }
    handleError(res, err, 'Failed to patch well');
  }
});

// ==================== SPECIFIC ARRAY UPDATE ROUTES ====================

// @route   PATCH /api/wells/:id/casing-profile
// @desc    Update casing profile
router.patch('/:id/casing-profile', async (req, res) => {
  try {
    await dbConnect();
    let { casingProfile } = req.body;
    
    // Ensure indexes are set
    if (casingProfile && Array.isArray(casingProfile)) {
      casingProfile = casingProfile.map((profile, idx) => ({
        ...profile,
        index: profile.index !== undefined ? profile.index : idx
      }));
    }
    
    const updatedWell = await Well.findByIdAndUpdate(
      req.params.id,
      { $set: { casingProfile } },
      { new: true, maxTimeMS: 10000 }
    );
    
    if (!updatedWell) {
      return res.status(404).json({ error: 'Well not found' });
    }
    
    res.json(updatedWell);
  } catch (err) {
    handleError(res, err, 'Failed to update casing profile');
  }
});

// @route   POST /api/wells/:id/mud-pits
// @desc    Add a mud pit
router.post('/:id/mud-pits', async (req, res) => {
  try {
    await dbConnect();
    const mudPit = req.body;
    
    const updatedWell = await Well.findByIdAndUpdate(
      req.params.id,
      { $push: { mudPits: mudPit } },
      { new: true, maxTimeMS: 10000 }
    );
    
    if (!updatedWell) {
      return res.status(404).json({ error: 'Well not found' });
    }
    
    res.json(updatedWell);
  } catch (err) {
    handleError(res, err, 'Failed to add mud pit');
  }
});

// @route   PUT /api/wells/:id/mud-pits/:pitIndex
// @desc    Update a specific mud pit
router.put('/:id/mud-pits/:pitIndex', async (req, res) => {
  try {
    await dbConnect();
    const pitIndex = parseInt(req.params.pitIndex);
    const mudPit = req.body;
    
    const well = await Well.findById(req.params.id);
    if (!well) return res.status(404).json({ error: 'Well not found' });
    
    if (pitIndex >= well.mudPits.length) {
      return res.status(404).json({ error: 'Mud pit not found' });
    }
    
    well.mudPits[pitIndex] = mudPit;
    await well.save();
    
    res.json(well);
  } catch (err) {
    handleError(res, err, 'Failed to update mud pit');
  }
});

// @route   DELETE /api/wells/:id/mud-pits/:pitIndex
// @desc    Delete a mud pit
router.delete('/:id/mud-pits/:pitIndex', async (req, res) => {
  try {
    await dbConnect();
    const pitIndex = parseInt(req.params.pitIndex);
    
    const well = await Well.findById(req.params.id);
    if (!well) return res.status(404).json({ error: 'Well not found' });
    
    well.mudPits.splice(pitIndex, 1);
    await well.save();
    
    res.json(well);
  } catch (err) {
    handleError(res, err, 'Failed to delete mud pit');
  }
});

// @route   POST /api/wells/:id/supply-vessels
// @desc    Add a supply vessel
router.post('/:id/supply-vessels', async (req, res) => {
  try {
    await dbConnect();
    const supplyVessel = req.body;
    
    const updatedWell = await Well.findByIdAndUpdate(
      req.params.id,
      { $push: { supplyVessels: supplyVessel } },
      { new: true, maxTimeMS: 10000 }
    );
    
    if (!updatedWell) {
      return res.status(404).json({ error: 'Well not found' });
    }
    
    res.json(updatedWell);
  } catch (err) {
    handleError(res, err, 'Failed to add supply vessel');
  }
});

// @route   PUT /api/wells/:id/supply-vessels/:vesselIndex
// @desc    Update a specific supply vessel
router.put('/:id/supply-vessels/:vesselIndex', async (req, res) => {
  try {
    await dbConnect();
    const vesselIndex = parseInt(req.params.vesselIndex);
    const supplyVessel = req.body;
    
    const well = await Well.findById(req.params.id);
    if (!well) return res.status(404).json({ error: 'Well not found' });
    
    if (vesselIndex >= well.supplyVessels.length) {
      return res.status(404).json({ error: 'Supply vessel not found' });
    }
    
    well.supplyVessels[vesselIndex] = supplyVessel;
    await well.save();
    
    res.json(well);
  } catch (err) {
    handleError(res, err, 'Failed to update supply vessel');
  }
});

// @route   DELETE /api/wells/:id/supply-vessels/:vesselIndex
// @desc    Delete a supply vessel
router.delete('/:id/supply-vessels/:vesselIndex', async (req, res) => {
  try {
    await dbConnect();
    const vesselIndex = parseInt(req.params.vesselIndex);
    
    const well = await Well.findById(req.params.id);
    if (!well) return res.status(404).json({ error: 'Well not found' });
    
    well.supplyVessels.splice(vesselIndex, 1);
    await well.save();
    
    res.json(well);
  } catch (err) {
    handleError(res, err, 'Failed to delete supply vessel');
  }
});

// @route   POST /api/wells/:id/cargo-vessels
// @desc    Add a cargo vessel
router.post('/:id/cargo-vessels', async (req, res) => {
  try {
    await dbConnect();
    const cargoVessel = req.body;
    
    const updatedWell = await Well.findByIdAndUpdate(
      req.params.id,
      { $push: { cargoVessels: cargoVessel } },
      { new: true, maxTimeMS: 10000 }
    );
    
    if (!updatedWell) {
      return res.status(404).json({ error: 'Well not found' });
    }
    
    res.json(updatedWell);
  } catch (err) {
    handleError(res, err, 'Failed to add cargo vessel');
  }
});

// @route   PUT /api/wells/:id/cargo-vessels/:vesselIndex
// @desc    Update a specific cargo vessel
router.put('/:id/cargo-vessels/:vesselIndex', async (req, res) => {
  try {
    await dbConnect();
    const vesselIndex = parseInt(req.params.vesselIndex);
    const cargoVessel = req.body;
    
    const well = await Well.findById(req.params.id);
    if (!well) return res.status(404).json({ error: 'Well not found' });
    
    if (vesselIndex >= well.cargoVessels.length) {
      return res.status(404).json({ error: 'Cargo vessel not found' });
    }
    
    well.cargoVessels[vesselIndex] = cargoVessel;
    await well.save();
    
    res.json(well);
  } catch (err) {
    handleError(res, err, 'Failed to update cargo vessel');
  }
});

// @route   DELETE /api/wells/:id/cargo-vessels/:vesselIndex
// @desc    Delete a cargo vessel
router.delete('/:id/cargo-vessels/:vesselIndex', async (req, res) => {
  try {
    await dbConnect();
    const vesselIndex = parseInt(req.params.vesselIndex);
    
    const well = await Well.findById(req.params.id);
    if (!well) return res.status(404).json({ error: 'Well not found' });
    
    well.cargoVessels.splice(vesselIndex, 1);
    await well.save();
    
    res.json(well);
  } catch (err) {
    handleError(res, err, 'Failed to delete cargo vessel');
  }
});

// @route   PUT /api/wells/:id/bop-systems
// @desc    Update all BOP systems
router.put('/:id/bop-systems', async (req, res) => {
  try {
    await dbConnect();
    const { bopSystems } = req.body;
    
    const updatedWell = await Well.findByIdAndUpdate(
      req.params.id,
      { $set: { bopSystems } },
      { new: true, maxTimeMS: 10000 }
    );
    
    if (!updatedWell) {
      return res.status(404).json({ error: 'Well not found' });
    }
    
    res.json(updatedWell);
  } catch (err) {
    handleError(res, err, 'Failed to update BOP systems');
  }
});

// @route   PUT /api/wells/:id/mud-pump-liners
// @desc    Update all mud pump liners
router.put('/:id/mud-pump-liners', async (req, res) => {
  try {
    await dbConnect();
    const { mudPumpLiners } = req.body;
    
    const updatedWell = await Well.findByIdAndUpdate(
      req.params.id,
      { $set: { mudPumpLiners } },
      { new: true, maxTimeMS: 10000 }
    );
    
    if (!updatedWell) {
      return res.status(404).json({ error: 'Well not found' });
    }
    
    res.json(updatedWell);
  } catch (err) {
    handleError(res, err, 'Failed to update mud pump liners');
  }
});

// ==================== DELETE ROUTES ====================

// @route   DELETE /api/wells/:id
// @desc    Delete a well
router.delete('/:id', async (req, res) => {
  try {
    await dbConnect();
    
    const deletedWell = await Well.findByIdAndDelete(req.params.id)
      .maxTimeMS(10000);
    
    if (!deletedWell) {
      return res.status(404).json({ 
        error: 'Not found',
        message: 'Well not found' 
      });
    }

    console.log(`Deleted well: ${deletedWell.wellName}`);
    res.json({ 
      message: 'Well deleted successfully',
      deletedWell 
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ 
        error: 'Invalid ID format',
        message: 'The provided well ID is invalid' 
      });
    }
    handleError(res, err, 'Failed to delete well');
  }
});

module.exports = router;