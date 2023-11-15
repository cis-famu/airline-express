const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const stripe = require('stripe')('pk_test_51O5G6JFrw9f1sOQs0GM6G92SYPuB8zWBcQt74axIYeNepnZPQZIE7im4vuiPgIfNeiDpAvi9KQEloiytkdWmWzkl00IyjAbihU');

const serviceAccount = require('firebase-credentials.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://airline-demo1.firebaseio.com',
});

const app = express();
app.use(bodyParser.json());


// Function to generate a unique rewards number
function generateRewardsNumber() {
    return 'R' + Math.floor(Math.random() * 9000000000) + 1000000000;
}

// User Registration
app.post('/register', async (req, res) => {
    try {
 
      const { firstName, lastName, email, password } = req.body;

        // Create the user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
        email,
        password
        });

        // Generate a unique rewards number
        const rewardsNumber = generateRewardsNumber();

        // Create a record in the User collection
        const userDocRef = admin.firestore().collection('User').doc(userRecord.uid);
        await userDocRef.set({
            firstName,
            lastName,
            email,
            rewardsNumber
        });

      res.status(200).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Fetch User Details
  app.get('/user/:userId', async (req, res) => {
    try {
      const userId = req.params.userId;
  
      // Fetch user record from Firestore
      const userDoc = await admin.firestore().collection('User').doc(userId).get();
  
      if (userDoc.exists) {
        const userData = userDoc.data();
        res.status(200).json({ user: userData });
      } else {
        res.status(404).json({ error: 'User not found' });
      }
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  app.get('/flights', async (req, res) => {
    try {
      // Fetch all flights from Firestore
      const flightsSnapshot = await admin.firestore().collection('flight').get();
  
      // Extract flight data from the snapshot
      const flights = [];
      flightsSnapshot.forEach((doc) => {
        const flightData = doc.data();
        flights.push({
          flightId: doc.id,
          aircraftType: flightData.aircraftType,
          arrivalAirport: flightData.arrivalAirport,
          arrivalDateTime: flightData.arrivalDateTime,
          availableSeats: flightData.availableSeats,
          departureAirport: flightData.departureAirport,
          departureDateTime: flightData.departureDateTime,
          flightStatus: flightData.flightStatus,
          mileage: flightData.mileage,
        });
      });
  
      res.status(200).json({ flights });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  

  // Make a Booking

  app.post('/create-booking', async (req, res) => {
    try {
      const {
        flightClass,
        flightNumber,
        passenger,
        paymentID,
        price,
        seatNumber,
      } = req.body;
  
      // Ensure passenger with the given rewardsNumber exists or create a new one
      let passengerID;
      if (passenger.rewardsNumber) {
        const existingPassengerQuery = await admin
          .firestore()
          .collection('Passenger')
          .where('rewardsNumber', '==', passenger.rewardsNumber)
          .limit(1)
          .get();
  
        if (!existingPassengerQuery.empty) {
          passengerID = existingPassengerQuery.docs[0].id;
        } else {
          // Create a new passenger
          const newPassengerRef = await admin.firestore().collection('Passenger').add({
            address: passenger.address,
            dateOfBirth: passenger.dateOfBirth,
            email: passenger.email,
            firstName: passenger.firstName,
            lastName: passenger.lastName,
            phone: passenger.phone,
            rewardsNumber: passenger.rewardsNumber
          });
  
          passengerID = newPassengerRef.id;
        }
      }
  
      // Create a new booking
      const bookingRef = await admin.firestore().collection('Booking').add({
        bookingDateTime: new Date(),
        flightClass,
        flightNumber,
        passengerID,
        paymentID,
        price,
        seatNumber,
      });
  
      res.status(200).json({ message: 'Booking created successfully', bookingID: bookingRef.id });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  
  // View a Booking
  app.get('/booking/:bookingId', async (req, res) => {
  try {
    const bookingId = req.params.bookingId;

    // Fetch booking details from Firestore
    const bookingDoc = await admin.firestore().collection('Booking').doc(bookingId).get();

    if (!bookingDoc.exists) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const bookingData = bookingDoc.data();

    // Fetch related data (Flight, Passenger, Payment) based on IDs stored in the booking document
    const flightDoc = await admin.firestore().collection('Flight').doc(bookingData.flightNumber).get();
    const passengerDoc = await admin.firestore().collection('Passenger').doc(bookingData.passengerID).get();
    const paymentDoc = await admin.firestore().collection('Payment').doc(bookingData.paymentID).get();

    if (!flightDoc.exists || !passengerDoc.exists || !paymentDoc.exists) {
      res.status(404).json({ error: 'Related data not found' });
      return;
    }

    const flightData = flightDoc.data();
    const passengerData = passengerDoc.data();
    const paymentData = paymentDoc.data();

    // Combine all data and send the response
    const bookingDetails = {
      bookingId: bookingDoc.id,
      bookingDateTime: bookingData.bookingDateTime,
      flightClass: bookingData.flightClass,
      flightDetails: {
        flightNumber: flightDoc.id,
        aircraftType: flightData.aircraftType,
        arrivalAirport: flightData.arrivalAirport,
        arrivalDateTime: flightData.arrivalDateTime,
        availableSeats: flightData.availableSeats,
        departureAirport: flightData.departureAirport,
        departureDateTime: flightData.departureDateTime,
        flightStatus: flightData.flightStatus,
        mileage: flightData.mileage,
      },
      passengerDetails: {
        passengerID: passengerDoc.id,
        firstName: passengerData.firstName,
        lastName: passengerData.lastName,
        email: passengerData.email,
        address: passengerData.address,
        dateOfBirth: passengerData.dateOfBirth,
        phone: passengerData.phone,
        rewardsNumber: passengerData.rewardsNumber,
      },
      paymentDetails: {
        paymentID: paymentDoc.id,
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate,
        paymentMethod: paymentData.paymentMethod,
        transactionID: paymentData.transactionID,
      },
      price: bookingData.price,
      seatNumber: bookingData.seatNumber,
    };

    res.status(200).json({ bookingDetails });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

  
  // Edit a Booking
  app.put('/booking/:bookingId', async (req, res) => {
    try {
      const bookingId = req.params.bookingId;
      const updatedData = req.body;
      // Implement updating booking logic using Firebase Firestore
      // Example: await admin.firestore().collection('booking').doc(bookingId).update(updatedData);
      res.status(200).json({ message: 'Booking updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  // Make a Payment using Stripe
app.post('/payment', async (req, res) => {
    try {
      const { userId, bookingId, amount, paymentMethodId } = req.body;
      // Implement payment logic using Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        payment_method: paymentMethodId,
        confirm: true,
      });
      // Update booking status or store payment details in Firestore
      // Example: await admin.firestore().collection('booking').doc(bookingId).update({ status: 'paid' });
      res.status(200).json({ message: 'Payment successful', paymentIntent });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // View Past Payments
  app.get('/payments/:passengerId', async (req, res) => {
    try {
      const passengerId = req.params.passengerId;
  
      // Fetch all bookings made by the passenger from Firestore
      const bookingsSnapshot = await admin.firestore().collection('Booking').where('passengerID', '==', passengerId).get();
  
      // Extract payment details from the bookings
      const payments = [];
  
      bookingsSnapshot.forEach(async (doc) =>  {
        const bookingData = doc.data();
  
        if (bookingData.paymentID) {
          const paymentDoc = await admin.firestore().collection('Payment').doc(bookingData.paymentID).get();
  
          if (paymentDoc.exists) {
            const paymentData = paymentDoc.data();
  
            payments.push({
              bookingId: doc.id,
              paymentID: paymentDoc.id,
              amount: paymentData.amount,
              paymentDate: paymentData.paymentDate,
              paymentMethod: paymentData.paymentMethod,
              transactionID: paymentData.transactionID,
            });
          }
        }
      });
  
      res.status(200).json({ payments });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
