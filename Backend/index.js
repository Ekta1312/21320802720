const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

app.post('/api/auth/register', async (req, res) => {
  try {
    const registrationData = {
      companyName: 'Train Central',
      ownerName: 'Ekta',
      rollNo: '21320802720',
      ownerEmail: 'ektaaggarwal.bansal@gmail.com',
      accessCode:sAzlpA
    };

    const registrationResponse = await axios.post(
      'http://20.244.56.144/train/register',
      registrationData
    );

    const { companyName, clientID, clientSecret } = registrationResponse.data;
    
    return res.status(200).json({ companyName, clientID, clientSecret });
  } catch (error) {
    console.error('Error in registration:', error);
    return res.status(500).json({ message: 'Failed to register with John Doe Railway Server' });
  }
});

//auth
app.post('api/auth/login', async (req, res) => {
  try {
    const authData = {
      companyName: 'Train Central',
      clientID: 'b46128a0-fbde-4c16-a4b1-6ae6ad718e27',
      ownerName: 'Ekta',
      ownerEmail: 'ektaaggarwal.bansal@gmail.com',
      rollNo: '21320802720',
      clientSecret: 'XOyo10RPayKB0dAN',
    };

    const authResponse = await axios.post('http://20.244.56.144/train/auth', authData);
    const accessToken = authResponse.data.access_token;

    // Generate a JWT token for the client to use for future authenticated requests
    const token = jwt.sign({ accessToken }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ token });
  } catch (error) {
    console.error('Error in authentication:', error);
    return res.status(500).json({ message: 'Failed to obtain authorization token' });
  }
});
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.sendStatus(401);
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };
  
  app.get('/api/trains', authenticateToken, async (req, res) => {
    try {
      const authHeader = { Authorization: `Bearer ${req.user.accessToken}` };
      const trainsResponse = await axios.get('http://20.244.56.144/train/trains', { headers: authHeader });
  
      const trainsData = trainsResponse.data;
       } catch (error) {
      console.error('Error in fetching train data:', error);
      return res.status(500).json({ message: 'Failed to fetch train data from John Doe Railway Server' });
    }
  });
  
 const filterTrains = (trainsData) => {
    const currentTime = new Date();
    const nextThirtyMinutes = new Date(currentTime.getTime() + 30 * 60 * 1000);
  
    return trainsData.filter((train) => {
      const departureTime = new Date(train.departureTime.Hours, train.departureTime.Minutes, train.departureTime.Seconds);
      return departureTime > nextThirtyMinutes;
    });
  };
   const sortTrains = (trainsData) => {
    return trainsData.sort((a, b) => {
      // Sort in ascending order of price
      const priceComparison = a.price.sleeper - b.price.sleeper;
      if (priceComparison !== 0) {
        return priceComparison;
      } const ticketsComparison = b.seatsAvailable.sleeper - a.seatsAvailable.sleeper;
      if (ticketsComparison !== 0) {
        return ticketsComparison;
      }  const departureTimeA = new Date(a.departureTime.Hours, a.departureTime.Minutes, a.departureTime.Seconds + a.delayedBy * 60);
      const departureTimeB = new Date(b.departureTime.Hours, b.departureTime.Minutes, b.departureTime.Seconds + b.delayedBy * 60);
      return departureTimeB - departureTimeA;
    });
  };
    const includeTrainsWithAllowedTimeWindow = (trainsData) => {
    const allowedTimeWindow = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
    return trainsData.filter((train) => {
        const departureTime = new Date(train.departureTime.Hours, train.departureTime.Minutes, train.departureTime.Seconds + train.delayedBy * 60);
    return departureTime <= allowedTimeWindow;
  });
};

app.get('/api/trains', authenticateToken, async (req, res) => {
    try {
        const filteredTrains = filterTrains(trainsData);
      const sortedTrains = sortTrains(filteredTrains);
      const finalTrains = includeTrainsWithAllowedTimeWindow(sortedTrains);
 const apiResponse = finalTrains.map((train) => ({
        trainName: train.trainName,
        trainNumber: train.trainNumber,
        departureTime: `${train.departureTime.Hours}:${train.departureTime.Minutes}:${train.departureTime.Seconds}`,
        seatsAvailable: {
          sleeper: train.seatsAvailable.sleeper,
          AC: train.seatsAvailable.AC,
        },
        price: {
          sleeper: train.price.sleeper,
          AC: train.price.AC,
        },
        delayedBy: train.delayedBy,
      }));
  
      return res.status(200).json(apiResponse);
    } catch (error) {
      console.error('Error in fetching train data:', error);
      return res.status(500).json({ message: 'Failed to fetch train data from John Doe Railway Server' });
    }
  });

  

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
