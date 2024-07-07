const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27020/footprint', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, required: true },
  password_hash: { type: String, required: true },
  schoolYear: { type: String, required: true },
});

const tripSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trip_name: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true },
  total_footprint: { type: Number }
});

const transportationModeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mode: { type: String, required: true },
  distance: { type: Number, required: true },
  carbon_emission: { type: Number }
});

const foodConsumptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  carbon_emission: { type: Number }
});

const energyConsumptionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accommodation_type: { type: String, required: true },
  nights_stayed: { type: Number, required: true },
  carbon_emission: { type: Number }
});

const rewardSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  points: { type: Number, required: true },
  description: { type: String }
});

const notificationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  is_read: { type: Boolean, default: false, required: true }
});

const carbonFootprintSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  foodFootprint: { type: Number, required: true },
  transportFootprint: { type: Number, required: true },
  energyFootprint: { type: Number, required: true },
  totalFootprint: { type: Number, required: true }
});

const User = mongoose.model('User', userSchema);
const CarbonFootprint = mongoose.model('CarbonFootprint', carbonFootprintSchema);
const Trip = mongoose.model('Trip', tripSchema);
const TransportationMode = mongoose.model('TransportationMode', transportationModeSchema);
const FoodConsumption = mongoose.model('FoodConsumption', foodConsumptionSchema);
const EnergyConsumption = mongoose.model('EnergyConsumption', energyConsumptionSchema);
const Reward = mongoose.model('Reward', rewardSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// Define API routes here
// app.post('/signup', async (req, res) => {
//   try {
//     const { username, email, password, schoolYear } = req.body;
//     const password_hash = await bcrypt.hash(password, saltRounds);

//     const newUser = new User({ username, email, password_hash, schoolYear });
//     await newUser.save();
//     res.status(201).send(newUser);
//   } catch (error) {
//     res.status(400).send(error);
//   }
// });


app.post('/signup', async (req, res) => {
  try {
    const { username, email, password, schoolYear } = req.body;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ username, email, password_hash, schoolYear });
    await newUser.save();
    res.status(201).send(newUser);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post('/carbon-footprint', async (req, res) => {
  try {
    const { user_id, foodFootprint, transportFootprint, energyFootprint, totalFootprint } = req.body;
    const carbonFootprint = new CarbonFootprint({
      user_id,
      foodFootprint,
      transportFootprint,
      energyFootprint,
      totalFootprint
    });

    await carbonFootprint.save();
    res.status(201).send('Carbon footprint saved successfully');
  } catch (error) {
    console.error('Error saving carbon footprint:', error);
    res.status(500).send('Internal Server Error');
  }
});



// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;
//   try {
//     const user = await User.findOne({ email });
//     if (user && await bcrypt.compare(password, user.password_hash)) {
//       res.status(200).json({ message: 'Login successful' });
//     } else {
//       res.status(400).json({ message: 'Invalid credentials' });
//     }
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });






// Existing imports and setup code...

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Login successful', user_id: user._id, schoolYear: user.schoolYear });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/check-carbon-footprint/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const carbonFootprint = await CarbonFootprint.findOne({ user_id });

    if (carbonFootprint) {
      res.status(200).json({ exists: true });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking carbon footprint:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Existing app.listen...

// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password_hash);

//     if (!isMatch) {
//       return res.status(400).json({ message: 'Invalid credentials' });
//     }

//     res.status(200).json({ message: 'Login successful' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });








app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
