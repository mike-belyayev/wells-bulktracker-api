const mongoose = require('mongoose');

const WellSchema = new mongoose.Schema({
  wellName: {
    type: String,
    required: true,
    trim: true
  },
  wellOwner: {
    type: String,
    required: true,
    trim: true
  },
  waterDepth: {
    type: String,
    trim: true
  },
  airGap: {
    type: String,
    trim: true
  },
  HPWH: {
    type: String,
    trim: true
  },
  casingProfile: [{
    index: {
      type: Number,
      required: true
    },
size: {
  type: String,
  trim: true
},
description:
{
  type: String,
  trim: true
},
type:
{
  type: String,
  trim: true
}
  }],
  mudPits: [{
    pitName: {
      type: String,
      required: true,
      trim: true
    },
    pitGroup: {
      type: String,
      trim: true
    },   order: {
    type: Number,
    default: 0
  },
  values: [{
        valueName: {
          type: String,
          trim: true
        },
        value: {
          type: String,
          trim: true
        }
    }],

  }],
  bopSystems: [{
    System: {
      type: String,
      trim: true
    },
    testDate: {
      type: Date,
      trim: true
    },
    nextDate: {
      type: Date,
      trim: true
    },
  }],
  mudPumpLiners: [{
    pump: {
      type: String,
      trim: true
    },
    liner: {
      type: String,
      trim: true
    },
    galStk: {
      type: String,
      trim: true
    },
    bblStk: {
      type: String,
      trim: true
    },
  }],
  cargoVessels: [{
    vesselName: {
      type: String,
      trim: true
    },
    arrivalDate: {
      type: Date,
      trim: true
    },
    cargoDetails: [{
      type: String,
      trim: true
    }],
  }],
  supplyVessels: [{
    vesselName: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    crewChange: {
      type: Date
    },
    // Known fields
    fuelOil: {
      type: String,
      trim: true
    },
    potWater: {
      type: String,
      trim: true
    },
    drlWater: {
      type: String,
      trim: true
    },
    barite: {
      type: String,
      trim: true
    },
    baseOil: {
      type: String,
      trim: true
    },
    cementG: {
      type: String,
      trim: true
    },
    // For unknown/optional fields - allows ANY additional fields
    additionalFields: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
}, {
  timestamps: true
});

module.exports = mongoose.model('Well', WellSchema);