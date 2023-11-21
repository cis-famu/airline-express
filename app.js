const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const stripe = require('stripe')('pk_test_51O5G6JFrw9f1sOQs0GM6G92SYPuB8zWBcQt74axIYeNepnZPQZIE7im4vuiPgIfNeiDpAvi9KQEloiytkdWmWzkl00IyjAbihU');

//const serviceAccount = require('firebase-credentials.json');
const serviceAccount = {
  "type": "service_account",
  "project_id": "airline-demo1",
  "private_key_id": "334e056abd206bdf9e3aba047a1535b6fe32b0a4",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDflkp1RLKx8tNH\nyZRivvXfGjFIvHKkpSzNh8Q/WpSM83W2OWxE2TIDp1mhQWWT/hEOS7+4b5rGhoGc\nkOqA7ko8P/t6tAv+7whIDEehKtsf7QrhmgebGnYiM9yerwUD7Nz1LC2AkBE2KRns\noaXqVeq7y4lwuWoVLpIDQZ8VkztDek0waXiT0oQlHP2ROrGPC0y6vIcll8FdE6CB\nVRDUGLi7oIl8H+elyL25/TUeR/oSBI2EZCtbLj/CBLZT3lsiWN0jch88aqogI3hT\nNw+BYC48rKbC8TagMengtguQ9bU+9OzKWurPGjc8PWH7gjThbJC7zmoltEKsWf2b\n2Qj3rg3VAgMBAAECggEAA6HSno+q1b40M1HX9gSyMzcwAwnHEHVQ/gomzziHPoTu\noSpbku+uUb95twmJB6qpwneo4nxu+t5Mkqcs8jGTMEhfzVvaiirCXoOojdRDbiYs\nnKUA0o+ThLV0PJwVtxKTV6jt5YB15pWSRyQKTx9lDH9WyiMqjMTwmp68+zdPch36\nfDZpcHzxkSjId68ORqbdRpMY9p0HXyNKSzNwNYe19GnMTlzuQh1vu3DcxWMsYRh9\nY1i6eOw5GkjHaWOtpMHHAneF65J2HARnhP2ME5P5WSuueOe/CgnNPoCX9RKTcSKS\nwwDIzBvpL6/CkktYYAMQX6+GaxiVqnAF2Q6gAYMdLwKBgQD7ZDwXWpSL5ddpkGok\nb1WIVPI0X6+lByyPzmI5gWxFgAm72+danFGuuuXIwx4Ig033yfm9z/JuK1E3jqIi\nzn5oooMO6DDmMnSLgD8FR87ybk2nlvVhlflI35FPp7lUZu33+NtyQW7GWdQww+hh\nUEbj1Qms5LMaTUy3JXMq67m98wKBgQDjr5JJpIXMI2w0kLD7EVAaT+IMJdfsZWvc\n39WffPMPc+pwIQSAqpsDBOE8s4mjU+mdMpvgq8r3KZwPOrvOrX2+DJmn9IcTv+/Q\n5GDKpEErsVUiuxN3cPOCZrIubO1Jvb3NOHWKNm/8GCqQHPAkb3cxt/3a7e721N8F\nxqdF3iBPFwKBgFRZz6fuZsWCO4NaR6MuED8McbCNIrx26cbe8ypkeNXhHmMAaGKI\n7Qd6ArwYbC1jEXhBNyEvcyLwOfIwU8rmCphFX0BTPIUhDOX6BCtbat8Bj+DZ0EAM\nOHbxPSrDFnZxiwuXXtq5hdfcMEykj4aHjyHHS9XNbyM2KLWTRU9zhQFtAoGAGhu4\n357xBL6PGtv4n2GV2N6OIix4vQ/INZSpL1epm30ERgVTOdnWWptFpKtFvifSIwd5\nnmK0rHDmB00J2iJEx/Uz7XF5x8b7ne2CN9pr6rGz/H6NNeYK1komZnJxJ0KNsCmo\nOMgTQUoYH1xiIRtzBI1/m4orG7y/Mi9cYQOemtMCgYBj7ii7cehi0GzXcyDmtV7Z\nbcNx0wvuMkcZ1avWJR83+JEYi1PUahDZQBsppSCWPS7ylVnwR2GMMJH77H0TM1Lt\n2q5PFl1JL1P3Q8KQ5s7xiDld6mq+i+MiK/sx7ljCwIsmcM9kDgvY5VTRDNN9QHOi\nua1gEAUwxA7kj9w0QR6slA==\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-693hf@airline-demo1.iam.gserviceaccount.com",
  "client_id": "114218634244853235882",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-693hf%40airline-demo1.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

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

async function sellSeat(flightId, seatType, quantity) {
  try {
    const flightRef = admin.firestore().collection('Flight').doc(flightId);
    const flightDoc = await flightRef.get();

    if (!flightDoc.exists) {
      console.error('Flight not found');
      return;
    }

    const currentSeats = flightDoc.data().availableSeats || {};

    if (!currentSeats[seatType] || currentSeats[seatType] < quantity) {
      console.error('Not enough available seats to sell');
      return;
    }

    // Update availableSeats map
    currentSeats[seatType] -= quantity;

    await flightRef.update({
      availableSeats: currentSeats,
    });

    console.log(`Successfully sold ${quantity} seat(s) of type ${seatType} for flight ${flightId}`);
  } catch (error) {
    console.error('Error selling seat:', error);
  }
}

async function returnSeat(flightId, seatType, quantity) {
  try {
    const flightRef = admin.firestore().collection('Flight').doc(flightId);
    const flightDoc = await flightRef.get();

    if (!flightDoc.exists) {
      console.error('Flight not found');
      return;
    }

    const currentSeats = flightDoc.data().availableSeats || {};

    // Update availableSeats map
    currentSeats[seatType] = (currentSeats[seatType] || 0) + quantity;

    await flightRef.update({
      availableSeats: currentSeats,
    });

    console.log(`Successfully returned ${quantity} seat(s) of type ${seatType} for flight ${flightId}`);
  } catch (error) {
    console.error('Error returning seat:', error);
  }
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

  app.post('/booking', async (req, res) => {
    try {
      const {
        flightClass,
        flightNumber,
        passenger,
        paymentID,
        price,
        seatNumber,
      } = req.body;
  
      const flightRef = admin.firestore().collection('Flight').doc(flightNumber);

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
          passengerID = existingPassengerQuery.docs[0];
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
  
          passengerID = newPassengerRef;
        }
      }
  
      // Create a new booking
      const bookingRef = await admin.firestore().collection('Booking').add({
        bookingDateTime: new Date(),
        flightClass,
        flightNumber: flightRef,
        passengerID,
        paymentID,
        price,
        seatNumber
      });
      sellSeat(flightNumber, flightClass, 1);
  
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
