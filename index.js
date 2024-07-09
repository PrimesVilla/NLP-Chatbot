
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue, Filter } = require('firebase-admin/firestore');
const express = require('express');
const bodyParser = require('body-parser');
const serviceAccount = require('./bot-property-finder-firebase-adminsdk-3lvqb-2d911af754.json');



const app = express();
app.use(bodyParser.json());
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

app.post('/webhook', async (req, res) => {
    let responseText ="";
    const propertiesRef = db.collection('/property');
  
    try {
    //query for search properties by location
    if (req.body.queryResult.intent.displayName == 'searchLocation') {
      const location = req.body.queryResult.parameters.location;
        const snapshot = await propertiesRef.where('location', '==', location).get();
  
        if (snapshot.empty) {
          return res.json({ fulfillmentText: `No properties found in ${location}.` });
        }
  
        responseText = `Here are some properties in ${location}:`;
        snapshot.forEach(doc => {
          const property = doc.data();
          responseText += `\nA ${property.name}, priced at ${property.price}, with ${property.bedroom} bedrooms, located at ${property.location}.`;
        });
  
        res.json({
          fulfillmentText: responseText
        });
    }
      
  
    //query for searching properties by type
    if (req.body.queryResult.intent.displayName == 'searchType') {
      const type = req.body.queryResult.parameters.type;
  
        const snapshot = await propertiesRef.where('type', '==', type).get();
  
        if (snapshot.empty) {
          return res.json({ fulfillmentText: `No properties found in ${type}.` });
        }
  
        responseText = `Here are some ${type} type properties:\n`;
        snapshot.forEach(doc => {
          const property = doc.data();
          responseText += `\nA ${property.name}, priced at ${property.price}, with ${property.bedroom} bedrooms, located at ${property.location}.`;
        });
  
        res.json({
          fulfillmentText: responseText
        });
      
    }
  
    //search properties by price
    if(req.body.queryResult.intent.displayName == 'searchPrice'){
      const price = req.body.queryResult.parameters.price;
    
        const snapshot = await propertiesRef.where('price', '<=', parseInt(price)).get();
  
        if (snapshot.empty) {
          return res.json({ fulfillmentText: `No properties found in ${price}.` });
        }
  
        responseText = `Here are some properties under ${price}:\n`;
        snapshot.forEach(doc => {
          const property = doc.data();
          responseText += `\nA ${property.name}, priced at ${property.price}, with ${property.bedroom} bedrooms, located at ${property.location}.`;
        });
  
        res.json({
          fulfillmentText: responseText
        });
      }
    }
  
    catch (err) {
        console.error('Error fetching properties:', err);
        res.status(500).json({ error: 'Database query error' });
    }
    
    //save user-bot conversation to firebase
    try {
      await db.collection(req.body.session).add({
        user: String(req.body.queryResult.queryText),
        bot: String(req.body.queryResult.fulfillmentText),
        intent: String(req.body.queryResult.intent.displayName),
        timestamp: FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error with db:', error);
      res.status(500).json({ error: `Error adding document to ${req.body.queryResult.session}` });
    }
  });
  
app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
